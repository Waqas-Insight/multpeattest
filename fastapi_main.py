import logging, uuid, os, tempfile, requests, re, gc, json, torch
from fastapi import FastAPI, File, UploadFile, Form, Query, Body
from fastapi.responses import JSONResponse
from typing import Optional, Dict, Any, List
from collections import defaultdict
import numpy as np
from pypdf import PdfReader
from rank_bm25 import BM25Okapi
from sentence_transformers import SentenceTransformer
from langchain.text_splitter import RecursiveCharacterTextSplitter
from qdrant_client import QdrantClient
from qdrant_client.models import PointStruct, Distance, VectorParams, Filter, FieldCondition, MatchValue, PointIdsList
from dotenv import load_dotenv

# 🌐 NEW: language detection for multilingual responses
from langdetect import detect_langs, DetectorFactory, LangDetectException
DetectorFactory.seed = 0  # deterministic detection

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[logging.FileHandler("app.log"), logging.StreamHandler()]
)

APP_ENV = os.getenv("APP_ENV", "staging").lower()

env_file = f".env.{APP_ENV}"
if os.path.exists(env_file):
    load_dotenv(env_file, override=True)
    print(f"✅ Loaded environment file: {env_file}")
else:
    load_dotenv(override=True)
    print(f"⚠️ {env_file} not found. Defaulting to standard .env or system env vars.")


QDRANT_HOST = os.getenv("QDRANT_HOST", "http://127.0.0.1:6333")
COLLECTION_NAME = os.getenv("COLLECTION_NAME", "nlp_docs_staging")
FACTS_COLLECTION_NAME = os.getenv("FACTS_COLLECTION_NAME", "policy_facts_staging")
PORT = int(os.getenv("PORT", "8002"))

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("uvicorn")
logger.info("=" * 60)
logger.info(f"🚀 ACTIVE ENVIRONMENT:       {APP_ENV.upper()}")
logger.info(f"📌 DOCS COLLECTION:         {COLLECTION_NAME}")
logger.info(f"📌 FACTS COLLECTION:        {FACTS_COLLECTION_NAME}")
logger.info(f"🌐 QDRANT HOST:             {QDRANT_HOST}")
logger.info(f"🔌 TARGET PORT:             {PORT}")
logger.info("=" * 60)

app = FastAPI()
model = SentenceTransformer("sentence-transformers/paraphrase-multilingual-mpnet-base-v2", device="cpu")
#client = QdrantClient("http://140.203.155.230:6333")
client = QdrantClient(QDRANT_HOST)
VECTOR_SIZE = 768
FACTS_VECTOR_SIZE = VECTOR_SIZE

if not client.collection_exists(COLLECTION_NAME):
    client.create_collection(
        collection_name=COLLECTION_NAME,
        vectors_config=VectorParams(size=VECTOR_SIZE, distance=Distance.COSINE)
    )

bm25 = None
all_docs = []

def clear_memory():
    logging.info("🧹 Clearing memory...")
    if torch.cuda.is_available():
        torch.cuda.empty_cache()
        torch.cuda.ipc_collect()
    gc.collect()

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "app_env": APP_ENV,
        "collections": {
            "docs": COLLECTION_NAME,
            "facts": FACTS_COLLECTION_NAME
        },
        "qdrant_host": QDRANT_HOST
    }

doc_to_index: Dict[str, int] = {}

@app.on_event("startup")
def load_index_on_start():
    global bm25, all_docs, doc_to_index
    filter_ = Filter(must=[FieldCondition(key="active", match=MatchValue(value=True))])
    points = client.scroll(collection_name=COLLECTION_NAME, scroll_filter=filter_, limit=10000)[0]
    all_docs = [p.payload["text"] for p in points if "text" in p.payload]
    doc_to_index = {doc: i for i, doc in enumerate(all_docs)}
    tokenized = [doc.split() for doc in all_docs]
    bm25 = BM25Okapi(tokenized) if tokenized else None
    logging.info(f"Loaded {len(all_docs)} documents into BM25 index")

@app.post("/reload-index")
def reload_index():
    load_index_on_start()
    return {"status": "BM25 index reloaded", "count": len(all_docs)}

@app.post("/normalize-existing")
def normalize_existing_records():
    updated_count = 0
    scroll_filter = Filter(must=[])
    points, _ = client.scroll(
        collection_name=COLLECTION_NAME,
        scroll_filter=scroll_filter,
        limit=10000,
        with_vectors=True  # Required to access point.vector
    )

    for point in points:
        payload = point.payload
        needs_update = False
        updated_payload = payload.copy()

        for key in ["country", "language", "category", "governance_level"]:
            if key in payload and isinstance(payload[key], str):
                normalized = normalize_filter_value(payload[key])
                if normalized != payload[key]:
                    updated_payload[key] = normalized
                    needs_update = True

        if needs_update:
            if point.vector is None:
                logging.warning(f"⚠️ Missing vector for point ID: {point.id}, skipping.")
                continue
            client.upsert(
                collection_name=COLLECTION_NAME,
                points=[
                    PointStruct(
                        id=point.id,
                        vector=point.vector,
                        payload=updated_payload
                    )
                ]
            )
            updated_count += 1

    return {"status": "normalization complete", "updated_records": updated_count}

def extract_text_from_pdf(file_path, chunk_size=500, chunk_overlap=50):
    reader = PdfReader(file_path)
    full_text = " ".join([p.extract_text() for p in reader.pages if p.extract_text()])
    splitter = RecursiveCharacterTextSplitter(chunk_size=chunk_size, chunk_overlap=chunk_overlap)
    return splitter.split_text(full_text)

def batch_encode(text_chunks, batch_size=32):
    return model.encode(text_chunks, batch_size=batch_size, convert_to_numpy=True).tolist()

def normalize_filter_value(value: str) -> str:
    if not value:
        return None
    return re.sub(r'\s+', ' ', str(value).strip().lower())

def insert_into_qdrant(text_chunks, filename, meta: dict):
    # Normalize values consistently
    for key in ["country", "language", "category", "governance_level"]:
        if meta.get(key):
            meta[key] = normalize_filter_value(meta[key])

    meta["active"] = str(meta.get("active", "true")).lower() in ("true", "1", "yes")

    existing = client.scroll(
        collection_name=COLLECTION_NAME,
        scroll_filter=Filter(must=[FieldCondition(key="filename", match=MatchValue(value=filename))]),
        limit=1
    )[0]
    if existing:
        logging.info(f"⚠️ Skipped duplicate file: {filename}")
        return

    embeddings = batch_encode(text_chunks)
    points = []
    for idx, (chunk, embedding) in enumerate(zip(text_chunks, embeddings)):
        payload = {"text": chunk, "filename": filename, "chunk_index": idx}
        payload.update(meta)
        points.append(PointStruct(id=str(uuid.uuid4()), vector=embedding, payload=payload))
    client.upsert(collection_name=COLLECTION_NAME, points=points)

@app.post("/upload")
def upload_pdf(
    file: UploadFile = File(...),
    author: str = Form(...),
    language: str = Form(...),
    category: Optional[str] = Form(None),
    country: Optional[str] = Form(None),
    region: Optional[str] = Form(None),
    record_id: Optional[str] = Form(None),
    governance_level: Optional[str] = Form(None),
    active: Optional[bool] = Form(True)
):
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        tmp.write(file.file.read())
        tmp_path = tmp.name
    chunks = extract_text_from_pdf(tmp_path)
    insert_into_qdrant(chunks, file.filename, meta={
        "author": author,
        "language": language,
        "category": category,
        "country": country,
        "region": region,
        "record_id": record_id,
        "active": active,
        "file_path": tmp_path,
        "governance_level": governance_level
    })
    clear_memory()
    return {"status": "uploaded", "chunks": len(chunks)}

#==============================================================================
#                   RAG
#==============================================================================

# 🌐 NEW: language helpers used by query_llm — covers all 24 official EU languages
LANG_NAMES = {
    "bg": ("Bulgarian",  "български"),
    "hr": ("Croatian",   "hrvatski"),
    "cs": ("Czech",      "čeština"),
    "da": ("Danish",     "dansk"),
    "nl": ("Dutch",      "Nederlands"),
    "en": ("English",    "English"),
    "et": ("Estonian",   "eesti keeles"),
    "fi": ("Finnish",    "suomi"),
    "fr": ("French",     "français"),
    "de": ("German",     "Deutsch"),
    "el": ("Greek",      "ελληνικά"),
    "hu": ("Hungarian",  "magyar"),
    "ga": ("Irish",      "Gaeilge"),
    "it": ("Italian",    "italiano"),
    "lv": ("Latvian",    "latviešu"),
    "lt": ("Lithuanian", "lietuvių"),
    "mt": ("Maltese",    "Malti"),
    "pl": ("Polish",     "polski"),
    "pt": ("Portuguese", "português"),
    "ro": ("Romanian",   "română"),
    "sk": ("Slovak",     "slovenčina"),
    "sl": ("Slovenian",  "slovenščina"),
    "es": ("Spanish",    "español"),
    "sv": ("Swedish",    "svenska"),
}

NOT_FOUND_MESSAGES = {
    "Bulgarian":  "<strong>Заявената информация не е намерена в предоставените документи.</strong>",
    "Croatian":   "<strong>Tražene informacije nisu pronađene u dostavljenim dokumentima.</strong>",
    "Czech":      "<strong>Požadované informace nebyly v poskytnutých dokumentech nalezeny.</strong>",
    "Danish":     "<strong>De ønskede oplysninger blev ikke fundet i de leverede dokumenter.</strong>",
    "Dutch":      "<strong>De gevraagde informatie is niet gevonden in de aangeleverde documenten.</strong>",
    "English":    "<strong>The requested information is not found in the provided documents.</strong>",
    "Estonian":   "<strong>Soovitud teavet ei leitud esitatud dokumentidest.</strong>",
    "Finnish":    "<strong>Pyydettyjä tietoja ei löytynyt toimitetuista asiakirjoista.</strong>",
    "French":     "<strong>Les informations demandées sont introuvables dans les documents fournis.</strong>",
    "German":     "<strong>Die angeforderten Informationen wurden in den bereitgestellten Dokumenten nicht gefunden.</strong>",
    "Greek":      "<strong>Οι ζητούμενες πληροφορίες δεν βρέθηκαν στα παρεχόμενα έγγραφα.</strong>",
    "Hungarian":  "<strong>A kért információ nem található a megadott dokumentumokban.</strong>",
    "Irish":      "<strong>Níor aimsíodh an t-eolas iarrtha sna doiciméid a soláthraíodh.</strong>",
    "Italian":    "<strong>Le informazioni richieste non sono presenti nei documenti forniti.</strong>",
    "Latvian":    "<strong>Pieprasītā informācija nav atrasta sniegtajos dokumentos.</strong>",
    "Lithuanian": "<strong>Prašoma informacija pateiktuose dokumentuose nerasta.</strong>",
    "Maltese":    "<strong>L-informazzjoni mitluba ma nstabitx fid-dokumenti pprovduti.</strong>",
    "Polish":     "<strong>Żądane informacje nie zostały znalezione w dostarczonych dokumentach.</strong>",
    "Portuguese": "<strong>As informações solicitadas não foram encontradas nos documentos fornecidos.</strong>",
    "Romanian":   "<strong>Informațiile solicitate nu au fost găsite în documentele furnizate.</strong>",
    "Slovak":     "<strong>Požadované informácie sa v poskytnutých dokumentoch nenašli.</strong>",
    "Slovenian":  "<strong>Zahtevanih informacij v predloženih dokumentih ni mogoče najti.</strong>",
    "Spanish":    "<strong>La información solicitada no se encuentra en los documentos proporcionados.</strong>",
    "Swedish":    "<strong>Den begärda informationen hittades inte i de tillhandahållna dokumenten.</strong>",
}

def detect_response_language(query: str, default_code: str = "en", min_confidence: float = 0.85):
    """Detect the language of the query. Falls back to default on low confidence or failure."""
    try:
        candidates = detect_langs(query)
        if candidates and candidates[0].prob >= min_confidence:
            code = candidates[0].lang
        else:
            logging.info(f"🌐 Low-confidence language detection on '{query[:50]}' — defaulting to '{default_code}'")
            code = default_code
    except LangDetectException:
        code = default_code
    return LANG_NAMES.get(code, LANG_NAMES["en"])  # (english_name, native_name)

# ---------------------------------------------------------------------------
# 1. Lookups & Pre-compiled Regex (Fast Path - < 0.1 ms execution)
# ---------------------------------------------------------------------------

COUNTRY_LOOKUP: Dict[str, str] = {
    # Austria
    "austria": "austria", "austrian": "austria", "österreich": "austria", "oesterreich": "austria", "autriche": "austria",
    # Belgium
    "belgium": "belgium", "belgian": "belgium", "belgique": "belgium", "belgië": "belgium", "belgien": "belgium",
    # Bulgaria
    "bulgaria": "bulgaria", "bulgarian": "bulgaria", "българия": "bulgaria",
    # Croatia
    "croatia": "croatia", "croatian": "croatia", "hrvatska": "croatia",
    # Cyprus
    "cyprus": "cyprus", "cypriot": "cyprus", "kypros": "cyprus", "kıbrıs": "cyprus",
    # Czech Republic
    "czech": "czech republic", "czechia": "czech republic", "česko": "czech republic", "česká republika": "czech republic",
    # Denmark
    "denmark": "denmark", "danish": "denmark", "danmark": "denmark",
    # Estonia
    "estonia": "estonia", "estonian": "estonia", "eesti": "estonia",
    # Finland
    "finland": "finland", "finnish": "finland", "suomi": "finland",
    # France
    "france": "france", "french": "france", "française": "france", "francais": "france",
    # Germany
    "germany": "germany", "german": "germany", "deutschland": "germany", "deutsch": "germany", "mecklenburg": "germany",
    # Greece
    "greece": "greece", "greek": "greece", "ελλάδα": "greece", "hellas": "greece",
    # Hungary
    "hungary": "hungary", "hungarian": "hungary", "magyarország": "hungary", "magyar": "hungary",
    # Ireland
    "ireland": "ireland", "irish": "ireland", "éire": "ireland", "eire": "ireland", "gaeilge": "ireland",
    # Italy
    "italy": "italy", "italian": "italy", "italia": "italy", "italiano": "italy",
    # Latvia
    "latvia": "latvia", "latvian": "latvia", "latvija": "latvia",
    # Lithuania
    "lithuania": "lithuania", "lithuanian": "lithuania", "lietuva": "lithuania",
    # Luxembourg
    "luxembourg": "luxembourg", "luxembourgish": "luxembourg", "lëtzebuerg": "luxembourg",
    # Malta
    "malta": "malta", "maltese": "malta", "malti": "malta",
    # Netherlands
    "netherlands": "netherlands", "dutch": "netherlands", "nederland": "netherlands", "holland": "netherlands",
    # Poland
    "poland": "poland", "polish": "poland", "polska": "poland", "polski": "poland",
    # Portugal
    "portugal": "portugal", "portuguese": "portugal", "português": "portugal",
    # Romania
    "romania": "romania", "romanian": "romania", "românia": "romania",
    # Slovakia
    "slovakia": "slovakia", "slovak": "slovakia", "slovensko": "slovakia",
    # Slovenia
    "slovenia": "slovenia", "slovenian": "slovenia", "slovenija": "slovenia",
    # Spain
    "spain": "spain", "spanish": "spain", "españa": "spain", "espana": "spain",
    # Sweden
    "sweden": "sweden", "swedish": "sweden", "sverige": "sweden",
    # United Kingdom
    "uk": "united kingdom", "united kingdom": "united kingdom", "britain": "united kingdom", "british": "united kingdom",
}

LEVEL_LOOKUP: Dict[str, str] = {
    "eu": "european", "europe": "european", "european": "european", "ue": "european",
    "union europea": "european", "union europeenne": "european", "union européenne": "european",
    "europäische union": "european", "europese unie": "european", "unia europejska": "european",
    "global": "global", "international": "global", "un": "global", "united nations": "global",
    "national": "national", "federal": "national",
    "regional": "regional", "provincial": "regional",
    "local": "local",
}

# Pre-compile unified Regex patterns sorted by length descending (matches multi-word terms first)
_COUNTRY_REGEX = re.compile(
    r"\b(" + "|".join(re.escape(k) for k in sorted(COUNTRY_LOOKUP.keys(), key=len, reverse=True)) + r")\b",
    re.IGNORECASE,
)

_LEVEL_REGEX = re.compile(
    r"\b(" + "|".join(re.escape(k) for k in sorted(LEVEL_LOOKUP.keys(), key=len, reverse=True)) + r")\b",
    re.IGNORECASE,
)

# Canonical validation targets
VALID_CANONICAL_COUNTRIES = set(COUNTRY_LOOKUP.values())
VALID_GOVERNANCE_LEVELS = set(LEVEL_LOOKUP.values())

# ---------------------------------------------------------------------------
# 1.5. Hybrid Extraction Function
# ---------------------------------------------------------------------------

def extract_entities_multilingual(query: str) -> Dict[str, Optional[str]]:
    """
    Extracts country and governance level entities using a high-performance fast path 
    (< 0.1 ms regex lookup) with a local LLM fallback (Ollama) for complex multilingual queries.
    """
    # 1. Fast Path: Single-pass pre-compiled regex lookup
    country_match = _COUNTRY_REGEX.search(query)
    level_match = _LEVEL_REGEX.search(query)

    extracted_country = COUNTRY_LOOKUP.get(country_match.group(0).lower()) if country_match else None
    extracted_level = LEVEL_LOOKUP.get(level_match.group(0).lower()) if level_match else None

    # Early return if fast path matched both entities
    if extracted_country and extracted_level:
        logging.info(f"⚡ Fast path matched country ('{extracted_country}') and level ('{extracted_level}')")
        return {"country": extracted_country, "governance_level": extracted_level}

    # 2. Slow Path: Fallback to local Ollama if missing either entity
    system_prompt = (
        "Identify if a specific country or governance level is referenced in the query. "
        "Valid regions are ONLY: 'european', 'global', 'national', 'regional', 'local'. "
        'Return ONLY a JSON object: {"country": "lowercased_english_country_or_null", "governance_level": "lowercased_region_or_null"}.'
    )

    payload = {
        "model": "mistral",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": query},
        ],
        "stream": False,
        "options": {"temperature": 0.0, "num_predict": 30},
    }

    try:
        res = requests.post("http://localhost:11434/api/chat", json=payload, timeout=8)
        res.raise_for_status()
        raw_text = res.json().get("message", {}).get("content", "").strip()
        clean_json = re.sub(r"```(?:json)?\s*([\s\S]*?)\s*```", r"\1", raw_text).strip()
        data = json.loads(clean_json)

        # Extract values from LLM response
        llm_country = data.get("country")
        llm_level = data.get("governance_level")

        # Normalize & validate LLM country output against canonical targets
        if llm_country:
            llm_country_lower = llm_country.lower().strip()
            # Resolve via COUNTRY_LOOKUP dictionary or check canonical validity
            llm_country_clean = COUNTRY_LOOKUP.get(llm_country_lower) or (
                llm_country_lower if llm_country_lower in VALID_CANONICAL_COUNTRIES else None
            )
            if not llm_country_clean:
                logging.warning(f"⚠️ LLM extracted unvalidated country '{llm_country}'. Ignoring.")
            else:
                extracted_country = extracted_country or llm_country_clean

        # Normalize & validate LLM governance level output
        if llm_level:
            llm_level_lower = llm_level.lower().strip()
            if llm_level_lower in VALID_GOVERNANCE_LEVELS:
                extracted_level = extracted_level or llm_level_lower
            else:
                logging.warning(f"⚠️ LLM extracted invalid level '{llm_level}'. Ignoring.")

    except Exception as e:
        logging.warning(f"⚠️ LLM entity extraction fallback failed: {e}")

    return {
        "country": extracted_country,
        "governance_level": extracted_level,
    }

# ---------------------------------------------------------------------------
# 2. Fact Injection Retriever
# ---------------------------------------------------------------------------
def retrieve_relevant_facts(query: str, country: Optional[str] = None, top_k: int = 3) -> List[str]:
    """Queries policy_facts_staging collection to pull structured key-value facts."""
    try:
        qvec = model.encode(query).tolist()
        must_filters = [FieldCondition(key="active", match=MatchValue(value=True))]
        if country:
            must_filters.append(FieldCondition(key="country", match=MatchValue(value=country)))

        results = client.search(
            collection_name=FACTS_COLLECTION_NAME,
            query_vector=qvec,
            limit=top_k,
            query_filter=Filter(must=must_filters)
        )

        facts = []
        for r in results:
            if r.score >= 0.35:
                payload = r.payload
                text_repr = payload.get("text") or payload.get("index_text") or f"{payload.get('entity')}: {payload.get('value_text') or payload.get('value_numeric')}"
                if text_repr and text_repr != "None: None":
                    facts.append(text_repr)
        return facts
    except Exception as e:
        logging.warning(f"⚠️ Fact retrieval skipped: {e}")
        return []

# ---------------------------------------------------------------------------
# 3. Capitalization Display Helper
# ---------------------------------------------------------------------------
def format_display_metadata(value: Optional[str]) -> str:
    """Formats lowercased database strings into capitalized UI text and strips region codes like (us) or (uk)."""
    if not value or value.lower() in ["unknown", "none", "null"]:
        return "Unknown"

    # Strip (us) or (uk) parenthetical suffixes (case-insensitive)
    cleaned = re.sub(r'\s*\((?:us|uk)\)', '', value, flags=re.IGNORECASE).strip()

    return " ".join([word.capitalize() for word in cleaned.split()])

# ---------------------------------------------------------------------------
# 4. Prompt Engineering & LLM Execution
# ---------------------------------------------------------------------------
# Keywords that indicate a quantitative or statistical question
STAT_QUERY_PATTERNS = r"\b(how much|area|hectare|ha|percentage|%|statistic|statistics|factsheet|factsheets|number|numbers|extent|total|breakdown|surface|coverage|amount)\b"

def query_llm(query: str, context_docs: list[dict], facts: list[str] = None):
    if not context_docs and not facts:
        return "No relevant policy documents or facts found matching your query.", []

    english_name, native_name = detect_response_language(query)

    # Format document chunks clearly showing Policy Title, Author, and Country
    context_chunks = []
    for d in context_docs:
        author = format_display_metadata(d.get('author'))
        filename = d.get('filename', 'Unknown Document')
        country = format_display_metadata(d.get('country'))
        policy_name = format_display_metadata(d.get('policy_name') or d.get('title'))

        # Title preference: explicit Policy Name > Author > Filename
        doc_title = policy_name if policy_name != "Unknown" else (author if author != "Unknown" else filename)
        country_tag = f" ({country})" if country != "Unknown" else ""

        context_chunks.append(
            f"### Document: {doc_title}{country_tag}\n"
            f"{d.get('text', '').strip()}"
        )

    context_text = "\n\n---\n\n".join(context_chunks)[:5000]

    fact_text = ""
    if facts:
        fact_text = "### Key Factsheet Data Points:\n" + "\n".join([f"- {fact}" for fact in facts]) + "\n\n"

    system_prompt = (
        "You are an expert policy assistant specializing in European peatland regulations, environmental governance, and sustainability."
        "\n\n**Formatting Rules (Strict Mandatory Schema):**\n"
        "- Use clear, clean **Markdown** structure ONLY.\n"
        "- NEVER use numbered lists (1., 2., 3., etc.). Use unordered bullet points (`-`) or Markdown subheadings (`###`) ONLY.\n"
        "- Structure policy overviews using `###` for each policy title, followed by bullet points (`-`) for its description and details.\n"
        "- Use `##` for main section titles.\n"
        "- Bold (`**`) critical terms, metrics, dates, and policy names UNLESS they are already preceded by a `##` heading indicator.\n"
        "- DO NOT output HTML tags like <h2>, <ul>, or <li>.\n"
        f"\n**Language Constraint:**\n"
        f"- Write the ENTIRE response in **{english_name}** ({native_name}).\n"
        "- Keep official policy titles, legal act names, and geographic locations in their original legal form where appropriate.\n"
        "\n**Policy Verification & Title Matching Guidelines:**\n"
        "- **Title & Synonym Reconciliation:** Treat informal user phrasing (e.g., 'Irish peatland strategy', 'German mire plan') as a DIRECT match for official document titles in the context (e.g., **National Peatlands Strategy (Ireland)**, **Federal Peatland Strategy**). Do NOT claim a document is missing if a clear equivalent title is present in the context.\n"
        "- **Specific Policy Queries:** When the user asks about a specific policy:\n"
        "   - Focus your primary answer directly on that specific policy's document chunks.\n"
        "   - If the requested policy is truly NOT in the context, state: 'The specific document [Requested Policy] was not found in the database, but related policies include...'\n"
        "- **Broad / Non-Existent Policy Frameworks:** ONLY if the user asks about a general concept that has no formal document equivalent anywhere in the context (e.g., asking about a national strategy for a country that only has local regional guidelines):\n"
        "   - Clarify in sentence 1 that no single standalone document exists by that exact title, then summarize the broader framework.\n"
        "   - NEVER mention other countries or EU-level strategies unless the user's query explicitly asked about them.\n"
        "- **Strict Scope & Citation:** Focus strictly on the geographic scope (e.g., country or region) requested by the user. Rely ONLY on the provided context."
    )

    user_prompt = f"{fact_text}Document Context:\n\n{context_text}\n\nQuestion:\n{query}\n\nProvide a structured Markdown response in {english_name}."
    
    payload = {
        "model": "mistral",
        "keep_alive": "10m",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        "stream": False,
        "options": {
            "num_ctx": 4096,
            "temperature": 0.1,
            "num_predict": 750
        }
    }

    try:
        res = requests.post("http://localhost:11434/api/chat", json=payload, timeout=60)
        res.raise_for_status()
        data = res.json()
        answer = data.get("message", {}).get("content") or "No output returned."

        answer = re.sub(r'\n*For more detailed statistics.*', '', answer, flags=re.IGNORECASE).strip()

        is_stat_query = bool(re.search(STAT_QUERY_PATTERNS, query, re.IGNORECASE))
        if facts and is_stat_query:
            answer += "\n\nFor more detailed statistics and information, please visit the [portal's Factsheets](https://peatlandpolicyportal.eu/factsheet)."

        return answer, context_docs
    except Exception as e:
        logging.exception("Ollama request failed")
        answer = f"Error generating response from LLM: {str(e)}"
        return answer, context_docs
    finally:
        clear_memory()

# ---------------------------------------------------------------------------
# 5. Staging Route Endpoint
# ---------------------------------------------------------------------------
@app.get("/ask")
def ask_question(
    query: str,
    min_score: Optional[float] = Query(0.3),
    language: Optional[str] = Query(None),
    country: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    governance_level: Optional[str] = Query(None),
    record_id: Optional[str] = Query(None)  # Merged ask_by_policy_id capability
):
    entities = extract_entities_multilingual(query)
    target_country = country or entities.get("country")
    target_level = governance_level or entities.get("governance_level")

    filters = [FieldCondition(key="active", match=MatchValue(value=True))]
    if target_country:
        filters.append(FieldCondition(key="country", match=MatchValue(value=normalize_filter_value(target_country))))
    if language:
        filters.append(FieldCondition(key="language", match=MatchValue(value=normalize_filter_value(language))))
    if category:
        filters.append(FieldCondition(key="category", match=MatchValue(value=normalize_filter_value(category))))
    if target_level:
        filters.append(FieldCondition(key="governance_level", match=MatchValue(value=normalize_filter_value(target_level))))
    if record_id:
        filters.append(FieldCondition(key="record_id", match=MatchValue(value=str(record_id))))

    query_filter = Filter(must=filters)

    docs = search(query, query_filter=query_filter, min_score=min_score)
    injected_facts = retrieve_relevant_facts(query, country=target_country)

    if not docs and not injected_facts:
        return JSONResponse(content={"answer": "No relevant policy documents or facts found matching your query.", "sources": []})

    answer, sources = query_llm(query, docs, facts=injected_facts)

    return JSONResponse(content={
        "answer": answer,
        "contexts": [d["text"] for d in sources if "text" in d],
        "injected_facts": injected_facts,
        "sources": [
            {
                "record_id": src["record_id"],
                "filename": src["filename"],
                "score": src["score"],
                "author": format_display_metadata(src.get("author")),
                "language": format_display_metadata(src.get("language")),
                "country": format_display_metadata(src.get("country")),
                "text": src.get("text"),
            }
            for src in sources
        ]
    })

#############
TITLE_VECTOR_CACHE: Dict[str, np.ndarray] = {}

def get_or_create_title_vector(doc_key: str, title_text: str) -> np.ndarray:
    """Retrieves or computes L2-normalized embedding for a document title."""
    if doc_key not in TITLE_VECTOR_CACHE:
        vec = model.encode(title_text, convert_to_numpy=True)
        norm = np.linalg.norm(vec)
        TITLE_VECTOR_CACHE[doc_key] = vec / (norm + 1e-9) if norm > 0 else vec
    return TITLE_VECTOR_CACHE[doc_key]


def search(query: str, top_k: int = 10, query_filter: Optional[Filter] = None, min_score: float = 0.25):
    if not all_docs:
        return []

    # 1. Encode query and normalize vector for fast dot-product similarity
    query_vec_np = model.encode(query, convert_to_numpy=True)
    norm_q = np.linalg.norm(query_vec_np)
    norm_query_vec = query_vec_np / (norm_q + 1e-9) if norm_q > 0 else query_vec_np
    query_vector = query_vec_np.tolist()

    # 2. Get BM25 scores and normalize them to a [0.0, 1.0] scale
    bm25_scores = bm25.get_scores(query.split()) if bm25 else np.zeros(len(all_docs))
    max_bm25 = float(np.max(bm25_scores)) if (len(bm25_scores) > 0 and np.max(bm25_scores) > 0) else 1.0

    # 3. Perform Qdrant dense vector retrieval
    results = client.search(
        collection_name=COLLECTION_NAME,
        query_vector=query_vector,
        limit=top_k * 2,
        query_filter=query_filter
    )

    scored = []
    for res in results:
        payload = res.payload or {}
        text = payload.get("text", "")

        # Scaled BM25 score (0.0 to 1.0)
        index = doc_to_index.get(text)
        raw_bm25 = bm25_scores[index] if index is not None else 0
        norm_bm25 = raw_bm25 / max_bm25

        # Cross-lingual Title Boost calculation
        author = payload.get("author", "")
        filename = payload.get("filename", "")
        policy_name = payload.get("policy_name", "")
        title_str = f"{policy_name} {author} {filename}".strip()

        title_boost = 0.0
        if title_str:
            doc_key = payload.get("record_id") or filename
            title_vec = get_or_create_title_vector(doc_key, title_str)

            # Cosine similarity between query and title (works across all 24 EU languages)
            title_sim = float(np.dot(norm_query_vec, title_vec))

            # Apply a proportional boost if the query semantically matches the policy title (> 0.45 threshold)
            if title_sim > 0.45:
                title_boost = (title_sim - 0.45) * 0.35

        # Hybrid Score = Dense Context Score + Normalized BM25 + Cross-Lingual Title Boost
        hybrid_score = res.score + (norm_bm25 * 0.2) + title_boost

        if hybrid_score >= min_score:
            scored.append({
                "text": text,
                "score": round(hybrid_score, 4),
                "record_id": payload.get("record_id"),
                "filename": filename,
                "author": author,
                "language": payload.get("language"),
                "country": payload.get("country")
            })

    grouped = {}
    for doc in scored:
        key = (doc["record_id"], doc["filename"], doc["author"])
        if key not in grouped or doc["score"] > grouped[key]["score"]:
            grouped[key] = doc

    return sorted(grouped.values(), key=lambda x: x["score"], reverse=True)[:top_k]

@app.get("/memory-stats")
def memory_stats():
    import psutil
    process = psutil.Process(os.getpid())
    mem = process.memory_info().rss / (1024 ** 3)
    return {"rss_memory_gb": round(mem, 2)}

@app.delete("/delete/{record_id}")
def delete_by_record_id(record_id: str):
    result = client.delete(
        collection_name=COLLECTION_NAME,
        points_selector=Filter(must=[FieldCondition(key="record_id", match=MatchValue(value=record_id))])
    )
    return {"status": "deleted", "record_id": record_id, "result": result}

# =========================
# FACTS SECTION (multilingual, single point per Odoo fact id)
# =========================

#FACTS_COLLECTION_NAME = "policy_facts"
FACTS_VECTOR_SIZE = VECTOR_SIZE  # 768

# Ensure facts collection exists
try:
    if not client.collection_exists(FACTS_COLLECTION_NAME):
        client.create_collection(
            collection_name=FACTS_COLLECTION_NAME,
            vectors_config=VectorParams(size=FACTS_VECTOR_SIZE, distance=Distance.COSINE)
        )
        logging.info(f"✅ Created Qdrant collection: {FACTS_COLLECTION_NAME}")
except Exception:
    logging.exception("Failed to init facts collection")

def build_fact_index_text(f: Dict[str, Any]) -> str:
    """Fallback text to embed if index_text not provided."""
    parts = []
    # Core triple-ish bits
    for k in ["entity", "predicate", "predicate_other", "value_text", "unit"]:
        v = f.get(k)
        if v:
            parts.append(str(v))
    # Contextual facets
    for k in ["country", "governance_level", "policy_name"]:
        v = f.get(k)
        if v:
            parts.append(str(v))
    # Numeric value last
    if f.get("value_numeric") is not None:
        parts.append(str(f.get("value_numeric")))
    txt = " | ".join(parts).strip()
    return re.sub(r"\s+", " ", txt) if txt else "fact"

def normalize_meta(v: Optional[str]) -> Optional[str]:
    return normalize_filter_value(v) if isinstance(v, str) else v

def _mean_unit_embedding(texts: List[str]) -> List[float]:
    """Compute mean of unit-normalized embeddings (safer for cosine)."""
    if not texts:
        # Extremely defensive: embed a generic token
        texts = ["fact"]
    vecs = model.encode(texts, batch_size=min(64, max(16, len(texts))), convert_to_numpy=True)
    # L2-normalize each, then mean, then normalize again
    vecs = np.array(vecs, dtype=np.float32)
    norms = np.linalg.norm(vecs, axis=1, keepdims=True) + 1e-9
    vecs = vecs / norms
    mean_vec = vecs.mean(axis=0)
    mean_vec = mean_vec / (np.linalg.norm(mean_vec) + 1e-9)
    return mean_vec.astype(np.float32).tolist()

@app.post("/facts/add")
def facts_add(payload: Dict[str, Any] = Body(...)):
    """
    Upsert facts using *Odoo integer ID* as Qdrant point ID.
    Multilingual: pass optional {"translations": {"en": "...", "et": "...", ...}}.
    We embed [index_text or auto-built] + all translations, average, and store one vector.
    Accepts a single dict or {"facts": [ ... ]}.
    """
    try:
        facts: List[Dict[str, Any]] = (
            payload.get("facts")
            if isinstance(payload, dict) and isinstance(payload.get("facts"), list)
            else [payload]
        )
        if not facts:
            return JSONResponse(status_code=400, content={"error": "no facts provided"})

        points: List[PointStruct] = []

        for f in facts:
            # ---- Validate id
            if "id" not in f:
                return JSONResponse(status_code=400, content={"error": "missing required field: id (must be Odoo integer id)"})
            try:
                pid = int(f["id"])
                if pid < 0:
                    raise ValueError("id must be unsigned integer")
            except Exception:
                return JSONResponse(status_code=400, content={"error": f"invalid id '{f.get('id')}', must be unsigned integer"})

            # ---- Normalize filterable metadata
            f["country"] = normalize_meta(f.get("country"))
            f["language"] = normalize_meta(f.get("language"))
            f["governance_level"] = normalize_meta(f.get("governance_level"))

            # ---- Build the list of texts to embed (primary + translations)
            texts_for_embed: List[str] = []
            primary_text = (f.get("index_text") or "").strip()
            if not primary_text:
                primary_text = build_fact_index_text(f)
            if primary_text:
                texts_for_embed.append(primary_text)

            translations = f.get("translations") or {}
            if isinstance(translations, dict):
                for lang_code, txt in translations.items():
                    if isinstance(txt, str) and txt.strip():
                        texts_for_embed.append(txt.strip())

            # ---- Compute a multilingual centroid vector
            try:
                vector = _mean_unit_embedding(texts_for_embed)
            except Exception as emb_err:
                logging.exception("Embedding failed in /facts/add")
                return JSONResponse(status_code=500, content={"error": f"embedding_failed: {str(emb_err)}"})

            # ---- Payload (store translations and primary text too)
            pl = f.copy()
            pl["index_text"] = primary_text
            pl["odoo_fact_id"] = pid
            # Ensure booleans/defaults if not set
            pl["active"] = bool(f.get("active", True))
            pl["is_current"] = bool(f.get("is_current", True))
            pl["priority_weight"] = float(f.get("priority_weight", 1.0))
            pl["confidence"] = float(f.get("confidence", 0.9))

            points.append(PointStruct(id=pid, vector=vector, payload=pl))

        # ---- Upsert
        try:
            client.upsert(collection_name=FACTS_COLLECTION_NAME, points=points)
        except Exception as q_err:
            logging.exception("Qdrant upsert failed in /facts/add")
            return JSONResponse(status_code=500, content={"error": f"qdrant_upsert_failed: {str(q_err)}"})

        clear_memory()
        return {"status": "ok", "upserted": len(points), "ids": [p.id for p in points]}

    except Exception as e:
        logging.exception("facts_add failed")
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.get("/facts/search")
def facts_search(
        query: str,
        top_k: int = Query(5, ge=1, le=50),
        min_score: float = Query(0.0),
        language: Optional[str] = Query(None),
        country: Optional[str] = Query(None),
        governance_level: Optional[str] = Query(None),
        only_current: bool = Query(False),
        only_active: bool = Query(True),
    ):
    """
    Vector search over multilingual facts.
    - Cross-lingual works out of the box (centroid vector).
    - Optional filters prefer matching primary metadata.
    """
    try:
        qvec = model.encode(query).tolist()
        must_filters = []
        if only_active:
            must_filters.append(FieldCondition(key="active", match=MatchValue(value=True)))
        if only_current:
            must_filters.append(FieldCondition(key="is_current", match=MatchValue(value=True)))
        if language:
            must_filters.append(FieldCondition(key="language", match=MatchValue(value=normalize_filter_value(language))))
        if country:
            must_filters.append(FieldCondition(key="country", match=MatchValue(value=normalize_filter_value(country))))
        if governance_level:
            must_filters.append(FieldCondition(key="governance_level", match=MatchValue(value=normalize_filter_value(governance_level))))
        qfilter = Filter(must=must_filters) if must_filters else None
        results = client.search(
            collection_name=FACTS_COLLECTION_NAME,
            query_vector=qvec,
            limit=top_k,
            query_filter=qfilter
        )
        out = []
        for r in results:
            if r.score < min_score:
                continue
            out.append({"id": r.id, "score": round(float(r.score), 4), "payload": r.payload})
        clear_memory()
        return {"query": query, "results": out}
    except Exception as e:
        logging.exception("facts_search failed")
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.delete("/facts/{fact_id}")
def facts_delete(fact_id: int):
    """Hard delete a fact by its *Odoo* integer ID (removes all languages since it’s one point)."""
    try:
        result = client.delete(
            collection_name=FACTS_COLLECTION_NAME,
            points_selector=PointIdsList(points=[fact_id])
        )
        return {"status": "deleted", "id": fact_id, "result": str(result)}
    except Exception as e:
        logging.exception("facts_delete failed")
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.get("/debug-policy/{policy_id}")
def debug_policy(policy_id: str):
    points, _ = client.scroll(
        collection_name=COLLECTION_NAME,
        scroll_filter=Filter(
            must=[FieldCondition(
                key="record_id",
                match=MatchValue(value=str(policy_id))
            )]
        ),
        limit=10
    )
    return {
        "policy_id": policy_id,
        "count": len(points),
        "sample": [p.payload for p in points[:2]]
    }