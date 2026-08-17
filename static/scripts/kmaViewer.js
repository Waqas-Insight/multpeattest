/* ============================================================================
 * KMA Policy Intelligence Viewer
 * ----------------------------------------------------------------------------
 * - Loads policy + chunks from Flask (which proxies Odoo).
 * - Renders PDFs with PDF.js to a <canvas>, with prev/next/zoom controls.
 * - Highlight overlay aligns with the canvas, not a floating iframe.
 * =========================================================================== */

// PDF.js worker — must be set before any getDocument() call.
if (window.pdfjsLib) {
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

// ── CONFIG (injected from template) ──────────────────────────────────────────
const CFG = window.KMA_CONFIG || {};
const FLASK_BASE = (CFG.flaskBase || '').replace(/\/$/, '');
const POLICY_ID  = CFG.policyId || 1;

// ── STATE ────────────────────────────────────────────────────────────────────
const state = {
  allChunks: [],
  pdfFiles: [],
  //activeFilter: { type: 'all', value: null },
  filters: {
    level: null,    // null = 'All Levels'
    class: null,    // null = 'All Classes'
    kpiOnly: false, // boolean flag for KPI filter
  },
  sortBy: 'default', // 'default', 'lv_desc', 'cl_desc', 'avg_desc'
  searchTerm: '',
  policy: {},

  // PDF.js
  pdfDoc: null,
  currentPdfUrl: null,
  currentPage: 1,
  totalPages: 0,
  zoom: 1.2,
  rendering: false,
  pendingPage: null,
};

const CLASS_DOT = {
  'Area': 'dot-area',
  'Emissions': 'dot-em',
  'Environment Quality': 'dot-eq',
  'Knowledge Resource': 'dot-kr',
  'Miscellaneous': 'dot-misc',
  'Policy Action': 'dot-poa',
  'Practical Resource': 'dot-pr',
  'Site Status': 'dot-site',
  'Spending': 'dot-sp',
};

const LEVEL_DOTS = {
  'Policy Action': 'dot-pa',
  'Policy Outcome': 'dot-po',
  'Unsure': 'dot-un',
};

// ── DOM ──────────────────────────────────────────────────────────────────────
const $ = (id) => document.getElementById(id);

// ── API HELPERS ──────────────────────────────────────────────────────────────
async function apiGet(path) {
  const res = await fetch(`${FLASK_BASE}${path}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  return res.json();
}

// ── INIT ─────────────────────────────────────────────────────────────────────
async function init() {
  try {
    const [policy, chunkData] = await Promise.all([
      apiGet(`/api/policy/${POLICY_ID}`),
      apiGet(`/api/policy/${POLICY_ID}/chunks?limit=2000`),
    ]);

    state.policy    = policy;
    state.allChunks = chunkData.chunks || [];
    state.pdfFiles  = policy.pdf_files || [];

    renderTopbar(policy);
    renderSidebar();
    renderChunks(state.allChunks);
    wireUpControls();

    if (state.pdfFiles.length > 0) {
      $('pdfName').textContent = state.pdfFiles[0].name;
      // Load (but don't render until a chunk is clicked)
      loadPdf(state.pdfFiles[0]);
    }
  } catch (e) {
    $('chunksWrap').innerHTML = `
      <div class="empty">
        <div class="empty-icon">⚠️</div>
        <div class="empty-title">Could not load data</div>
        <div class="empty-sub">
          ${escHtml(e.message)}<br><br>
          Try <code>?policy_id=1</code> in the URL, or check Flask logs.
        </div>
      </div>`;
  }
}

// ── TOPBAR ───────────────────────────────────────────────────────────────────
function renderTopbar(p) {
  $('policyTitle').textContent = p.name || 'Untitled policy';
  const metas = [
    p.country      && `<div class="meta-tag">🌍 <b>${escHtml(p.country)}</b></div>`,
    p.year_from    && `<div class="meta-tag">📅 <b>${escHtml(p.year_from)}${p.year_to ? '–' + escHtml(p.year_to) : ''}</b></div>`,
    p.policy_level && `<div class="meta-tag">🏛 <b>${escHtml(p.policy_level)}</b></div>`,
    p.chunk_count  && `<div class="meta-tag">📄 <b>${p.chunk_count}</b> sentences</div>`,
  ].filter(Boolean).join('');
  const pppage = `<a href="/policy/${POLICY_ID}" class="btn btn-success meta-tag" target="_blank" style="color: black;">↖ Policy Profile</a>`;
  $('policyMeta').innerHTML = [pppage, metas].join('');
}

// ── SIDEBAR ──────────────────────────────────────────────────────────────────
function renderSidebar() {
  const levelCounts = {};
  const classCounts = {};
  let kpiCount = 0;

  state.allChunks.forEach((c) => {
    levelCounts[c.level] = (levelCounts[c.level] || 0) + 1;
    classCounts[c.class] = (classCounts[c.class] || 0) + 1;
    if (c.has_metric) kpiCount++;
  });

  let html = `
    <!-- Sort Options -->
    <div class="filter-section">
      <span class="filter-label">Sort By</span>
      <select id="sortSelect" class="search" style="margin-top:4px; padding:6px;">
        <option value="default" ${state.sortBy === 'default' ? 'selected' : ''}>Default (Page Order)</option>
        <option value="lv_desc" ${state.sortBy === 'lv_desc' ? 'selected' : ''}>Level Conf. (High → Low)</option>
        <option value="cl_desc" ${state.sortBy === 'cl_desc' ? 'selected' : ''}>Class Conf. (High → Low)</option>
        <option value="avg_desc" ${state.sortBy === 'avg_desc' ? 'selected' : ''}>Avg Conf. (High → Low)</option>
      </select>
    </div>

    <!-- KPI Toggle -->
    <div class="filter-section">
      <span class="filter-label">Metrics</span>
      <div class="f-btn ${state.filters.kpiOnly ? 'active' : ''}" id="kpiBtn">
        <div class="f-left"><div class="f-dot dot-all" style="background:#ffc107;"></div>KPIs Only</div>
        <div class="f-count">${kpiCount}</div>
      </div>
    </div>

    <!-- Level Filters -->
    <div class="filter-section">
      <span class="filter-label">Levels</span>
      <div class="f-btn ${state.filters.level === null ? 'active' : ''}" data-filter-type="level" data-filter-value="">
        <div class="f-left"><div class="f-dot dot-all"></div>All Levels</div>
        <div class="f-count">${state.allChunks.length}</div>
      </div>`;

  Object.entries(levelCounts).sort().forEach(([lvl, cnt]) => {
    const isActive = state.filters.level === lvl ? 'active' : '';
    html += `
      <div class="f-btn ${isActive}" data-filter-type="level" data-filter-value="${escAttr(lvl)}">
        <div class="f-left">
          <div class="f-dot ${LEVEL_DOTS[lvl] || 'dot-all'}"></div>${escHtml(lvl)}
        </div>
        <div class="f-count">${cnt}</div>
      </div>`;
  });

  html += `</div><div class="filter-section"><span class="filter-label">Classes</span>
      <div class="f-btn ${state.filters.class === null ? 'active' : ''}" data-filter-type="class" data-filter-value="">
        <div class="f-left"><div class="f-dot dot-all"></div>All Classes</div>
        <div class="f-count">${state.allChunks.length}</div>
      </div>`;

  Object.entries(classCounts).sort().forEach(([cls, cnt]) => {
    const isActive = state.filters.class === cls ? 'active' : '';
    html += `
      <div class="f-btn ${isActive}" data-filter-type="class" data-filter-value="${escAttr(cls)}">
        <div class="f-left">
          <div class="f-dot ${CLASS_DOT[cls] || 'dot-all'}"></div>${escHtml(cls)}
        </div>
        <div class="f-count">${cnt}</div>
      </div>`;
  });

  html += `</div>`;
  const filterArea = $('filterArea');
  filterArea.innerHTML = html;

  // Event Listener: Sort Change
  $('sortSelect').onchange = (e) => {
    state.sortBy = e.target.value;
    applyFilters();
  };

  // Event Listener: KPI Toggle
  $('kpiBtn').onclick = () => {
    state.filters.kpiOnly = !state.filters.kpiOnly;
    renderSidebar();
    applyFilters();
  };

  // Event Listener: Level and Class Filters
  filterArea.onclick = (e) => {
    const btn = e.target.closest('.f-btn');
    if (!btn || btn.id === 'kpiBtn') return;

    const type = btn.dataset.filterType;
    if (!type) return;

    state.filters[type] = btn.dataset.filterValue || null;
    renderSidebar();
    applyFilters();
  };
}

// ── CHUNK LIST ───────────────────────────────────────────────────────────────
function getTagClass(level) {
  if (level === 'Policy Action')  return 'tag-level-pa';
  if (level === 'Policy Outcome') return 'tag-level-po';
  return 'tag-level-un';
}

function renderChunks(chunks) {
  const wrap = $('chunksWrap');
  if (!chunks.length) {
    wrap.innerHTML = `
      <div class="empty">
        <div class="empty-icon">🔍</div>
        <div class="empty-title">No sentences found</div>
        <div class="empty-sub">Try a different filter or search term.</div>
      </div>`;
    return;
  }

  wrap.innerHTML = chunks.map((c, i) => `
    <div class="card ${i === 0 ? 'active' : ''}"
         id="card-${c.id}"
         data-chunk-id="${c.id}"
         data-page="${c.page}">
      <div class="card-top">
        <div class="card-page">Page ${c.page}</div>
        <div class="card-tags">
          <div class="tag ${getTagClass(c.level)}">${escHtml(c.level)}</div>
          <div class="tag tag-class">${escHtml(c.class)}</div>
          ${c.has_metric ? '<div class="kpi-badge">KPI</div>' : ''}
        </div>
      </div>
      <div class="card-text truncated">${escHtml(c.text)}</div>
      <div class="card-foot">
        <div class="conf-bars">
          <div class="conf">
            Lv
            <div class="conf-bar"><div class="conf-fill" style="width:${Math.round(c.lv_confidence * 100)}%"></div></div>
            ${Math.round(c.lv_confidence * 100)}%
          </div>
          <div class="conf">
            Cl
            <div class="conf-bar"><div class="conf-fill" style="width:${Math.round(c.cl_confidence * 100)}%"></div></div>
            ${Math.round(c.cl_confidence * 100)}%
          </div>
        </div>
        <div class="view-src">View in PDF →</div>
      </div>
    </div>
  `).join('');

  // Wire card clicks (event delegation)
  wrap.onclick = (e) => {
    const card = e.target.closest('.card');
    if (!card) return;
    document.querySelectorAll('.card').forEach((c) => c.classList.remove('active'));
    card.classList.add('active');
    const page = parseInt(card.dataset.page, 10) || 1;
    goToPage(page);
  };

  // Auto-open the first one
  if (chunks.length > 0) {
    goToPage(chunks[0].page);
  }
}

// ── FILTERS / SEARCH ─────────────────────────────────────────────────────────
function applyFilters() {
  let filtered = state.allChunks;
  // 1. Filter by Level
  if (state.filters.level) {
    filtered = filtered.filter((c) => c.level === state.filters.level);
  }
  // 2. Filter by Class
  if (state.filters.class) {
    filtered = filtered.filter((c) => c.class === state.filters.class);
  }
  // 3. Filter by KPI
  if (state.filters.kpiOnly) {
    filtered = filtered.filter((c) => c.has_metric);
  }
  // 4. Filter by Search Query
  if (state.searchTerm) {
    const q = state.searchTerm.toLowerCase();
    filtered = filtered.filter((c) =>
      (c.text || '').toLowerCase().includes(q) ||
      (c.level || '').toLowerCase().includes(q) ||
      (c.class || '').toLowerCase().includes(q)
    );
  }
  // 5. Apply Confidence Sorting
  filtered = [...filtered]; // Clone array before sorting
  if (state.sortBy === 'lv_desc') {
    filtered.sort((a, b) => b.lv_confidence - a.lv_confidence);
  } else if (state.sortBy === 'cl_desc') {
    filtered.sort((a, b) => b.cl_confidence - a.cl_confidence);
  } else if (state.sortBy === 'avg_desc') {
    filtered.sort((a, b) => {
      const avgA = (a.lv_confidence + a.cl_confidence) / 2;
      const avgB = (b.lv_confidence + b.cl_confidence) / 2;
      return avgB - avgA;
    });
  }
  renderChunks(filtered);
}

// ── PDF (PDF.js) ─────────────────────────────────────────────────────────────
async function loadPdf(pdfFile) {
  if (!window.pdfjsLib) {
    toast('PDF.js failed to load');
    return;
  }

  // Build the Flask-proxied URL. Server expects /api/pdf/<attachment_id>.
  // If the Odoo response gives a full URL instead, the file object must
  // include attachment_id (preferred) or we fall back to the raw url.
  let pdfUrl;
  if (pdfFile.attachment_id) {
    pdfUrl = `${FLASK_BASE}/api/pdf/${pdfFile.attachment_id}`;
  } else if (pdfFile.url) {
    // Fallback — only works if same-origin / CORS allows it.
    pdfUrl = pdfFile.url;
  } else {
    toast('PDF has no URL');
    return;
  }

  state.currentPdfUrl = pdfUrl;
  $('pdfEmpty').classList.remove('hidden');
  $('pdfCanvasWrap').classList.remove('ready');

  try {
    const loadingTask = pdfjsLib.getDocument(pdfUrl);
    state.pdfDoc = await loadingTask.promise;
    state.totalPages = state.pdfDoc.numPages;
    $('totPage').textContent = state.totalPages;
    $('pdfEmpty').classList.add('hidden');
    $('pdfCanvasWrap').classList.add('ready');
    await renderPage(state.currentPage || 1);
  } catch (e) {
    console.error('PDF load failed', e);
    $('pdfEmpty').innerHTML = `
      <div class="empty-icon">⚠️</div>
      <div class="empty-title">Could not load PDF</div>
      <div class="empty-title">This issue will be resolved in the next update. In the meantime, please explore the identified excerpts themselves.</div>
      <div class="empty-sub">${escHtml(e.message || String(e))}</div>`;
  }
}

async function renderPage(pageNum) {
  if (!state.pdfDoc) return;
  if (state.rendering) {
    // Queue the latest requested page; current render will pick it up after.
    state.pendingPage = pageNum;
    return;
  }
  state.rendering = true;

  const clamped = Math.max(1, Math.min(pageNum, state.totalPages));
  state.currentPage = clamped;
  $('curPage').textContent = clamped;
  $('prevPage').disabled = clamped <= 1;
  $('nextPage').disabled = clamped >= state.totalPages;

  try {
    const page = await state.pdfDoc.getPage(clamped);
    const canvas = $('pdfCanvas');
    const ctx = canvas.getContext('2d');
    const wrap = $('pdfCanvasWrap');

    // --- FIX: Force-constrain the wrapper layout on desktop view ---
    if (window.innerWidth > 800 && wrap) {
      // Find out how much vertical space the main layout block has
      const mainLayout = $('mainLayout');
      if (mainLayout) {
        const availableHeight = mainLayout.getBoundingClientRect().height;
        // Keep the wrapper slightly shorter than the layout to account for headers/controls
        wrap.style.maxHeight = `${availableHeight - 60}px`;
        wrap.style.overflow = 'auto'; 
      }
    }

    // DPI-aware rendering for crisp text
    const dpr = window.devicePixelRatio || 1;
    const viewport = page.getViewport({ scale: state.zoom });
    canvas.width  = Math.floor(viewport.width  * dpr);
    canvas.height = Math.floor(viewport.height * dpr);
    canvas.style.width  = `${Math.floor(viewport.width)}px`;
    canvas.style.height = `${Math.floor(viewport.height)}px`;

    const renderCtx = {
      canvasContext: ctx,
      viewport,
      transform: dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : null,
    };
    await page.render(renderCtx).promise;

    // Generic highlight (no bbox available); positioned over upper-middle
    const hl = $('highlight');
    hl.style.display = 'block';
    hl.style.top  = '15%';
    hl.style.left = '8%';
    hl.style.width  = '84%';
    hl.style.height = '8%';
  } catch (e) {
    console.error('Render failed', e);
    toast(`Could not render page ${clamped}`);
  } finally {
    state.rendering = false;
    if (state.pendingPage && state.pendingPage !== clamped) {
      const next = state.pendingPage;
      state.pendingPage = null;
      renderPage(next);
    }
  }
}

function goToPage(pageNum) {
  $('pdfPg').textContent = `Page ${pageNum}`;
  if (state.pdfDoc) renderPage(pageNum);
  else state.currentPage = pageNum;  // remember for when PDF finishes loading
}

// ── CONTROLS ─────────────────────────────────────────────────────────────────
function wireUpControls() {
  $('prevPage').addEventListener('click', () => goToPage(state.currentPage - 1));
  $('nextPage').addEventListener('click', () => goToPage(state.currentPage + 1));
  $('zoomIn').addEventListener('click', () => {
    state.zoom = Math.min(state.zoom + 0.2, 3.0);
    renderPage(state.currentPage);
  });
  $('zoomOut').addEventListener('click', () => {
    state.zoom = Math.max(state.zoom - 0.2, 0.5);
    renderPage(state.currentPage);
  });

  $('searchInput').addEventListener('input', (e) => {
    state.searchTerm = (e.target.value || '').toLowerCase();
    applyFilters();
  });

  // Keyboard nav for PDF
  document.addEventListener('keydown', (e) => {
    if (document.activeElement && document.activeElement.tagName === 'INPUT') return;
    if (e.key === 'ArrowLeft')  goToPage(state.currentPage - 1);
    if (e.key === 'ArrowRight') goToPage(state.currentPage + 1);
  });
}

// ── UTILS ────────────────────────────────────────────────────────────────────
function escHtml(t) {
  return String(t == null ? '' : t)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
function escAttr(t) {
  return escHtml(t).replace(/"/g, '&quot;');
}
function toast(msg) {
  const el = $('toast');
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2500);
}

// ── GO ───────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', init);
