from PyPDF2 import PdfReader
import nltk
#nltk.download('punkt')
import json
import unidecode
import re
from typing import Dict, List, Any, Set
#########
# Policy Incentive Tool
##########

def txt_to_dct(pdfReader):
    '''
    Input: 
        pdfReader (PyPDF2 object): Reader in use in loop
    Returns:
        doc_dict (dct): dictionary of single pdf with text
    '''
    doc_dict = {}
    doc_dict["text"]=""
    for page in range(len(pdfReader.pages)):
        page_text = pdfReader.pages[page].extract_text()  # extracting pdf text
        #page_text = text_cleaning(page_text)  # clean pdf text
        doc_dict["text"] += page_text  # concatenate pages' text
    return doc_dict

def get_pdf_text(filename):
    '''
    Input:
        filename (str): path directory or zip folder of pdfs
    Output:
        error messages
    Returns:
        pdf_dict (dct): dictionary of pdfs text
    '''
    try:
        pdfReader = PdfReader(filename)  # read file
        # doc_dict holds the attributes of each pdf file
        doc_dict = txt_to_dct(pdfReader)
        return doc_dict
    except Exception as e:  # In case the file is corrupted
        print(f"Could not read {filename} due to {e}")
        return None
##########################
# From Firebanks-Quevedo #
##########################
def text_cleaning(text):
    """
    From previous repository
    Cleans a piece of text by removing escaped characters.
    Args:
        text (str): string with text
    Returns:
        str: cleaned piece of text
    """
    # Remove escaped characters
    escapes = ''.join([chr(char) for char in range(1, 32)])
    text = text.translate(str.maketrans('', '', escapes))
    return text

def remove_html_tags(text: str) -> str:
    """Remove html tags from a string"""
    return re.sub(re.compile('<.*?>'), '', text)

def replace_links(text: str) -> str:
    text = re.sub(r'http\S+', '[URL]', text)
    return re.sub(r'www\S+', '[URL]', text)

def remove_multiple_spaces(text: str) -> str:
    return re.sub('\s+', ' ', text)

def parse_emails(text: str) -> str:
    """
    Remove the periods from emails in text, except the last one
    """
    emails = [email if email[-1] != "." else email[:-1] for email in re.findall(r"\S*@\S*\s?", text)]
    for email in emails:
        new_email = email.replace(".", "")
        text = text.replace(email, new_email)
    return text

def parse_acronyms(text: str) -> str:
    """
    Remove the periods from acronyms in the text (i.e "U.S." becomes "US")
    """
    acronyms = re.findall(r"\b(?:[a-zA-Z]\.){2,}", text)
    for acronym in acronyms:
        new_acronym = acronym.replace(".", "")
        text = text.replace(acronym, new_acronym)
    return text

def preprocess_text(txt: str, remove_new_lines: bool = False) -> str:
    """
    From previous repository
    Steps in the preprocessing of text:
        0. Run text cleaning script (moved from pdf to json script)
        1. Remove HTML tags
        2. Replace URLS by a tag [URL]
        3. Replace new lines and tabs by normal spaces - sometimes sentences have new lines in the middle
        4. Remove excessive spaces (more than 1 occurrence)
        5. Parse emails and abreviations
    """
    txt = text_cleaning(txt)
    txt = replace_links(remove_html_tags(txt)).strip()
    if remove_new_lines:
        txt = txt.replace("\n", " ").replace("\t", " ").strip()
    txt = remove_multiple_spaces(txt)
    txt = parse_emails(txt)
    txt = parse_acronyms(txt)
    new_txt = ""
    all_period_idx = set([indices.start() for indices in re.finditer("\.", txt)])
    for i, char in enumerate(txt):
        if i in all_period_idx:
            # Any char following a period that is NOT a space means that we should not add that period
            if i + 1 < len(txt) and txt[i + 1] != " ":
                continue
            # NOTE: Any char that is a number following a period will not count.
            # For enumerations, we're counting on docs being enumerated as "(a)" or "(ii)", and if not,
            # they will be separated by the "." after the number:
            # "Before bullet point. 3. Bullet point text" will just be "Before bullet point 3." and "Bullet point text" as the sentences
            if i + 2 < len(txt) and txt[i + 2].isnumeric():
                continue
            # If we wanted to have all numbered lists together, uncomment this, and comment out the previous condition
            # if i + 2 < len(txt) and not txt[i + 2].isalpha():
            #     continue
        new_txt += char
    return new_txt

def preprocess_english_text(txt: str, remove_new_lines: bool = False) -> str:
    '''
    From previous repository
    '''
    return preprocess_text(txt, remove_new_lines)

def remove_short_sents(sents: List[str], min_num_words: int = 4) -> List[str]:
    """
    From previous repository
    Remove sentences that are made of less than a given number of words. Default is 4
    """
    return [sent for sent in sents if len(sent.split()) >= min_num_words]

def get_nltk_sents(txt: str, tokenizer: nltk.PunktSentenceTokenizer, extra_abbreviations: Set[str] = None) -> List[str]:
    '''
    From previous repository
    '''
    if extra_abbreviations is not None:
        tokenizer._params.abbrev_types.update(extra_abbreviations)
    return tokenizer.tokenize(txt)

#######################
###################
###############
def get_clean_eng_sents(pdf_conv, tokenizer):
    '''
    Takes a full text of pdf file and returns all sentences, cleaned, in one list
    Input:
        pdf_conv (dct): dictionary of full text of pdf files
    Output: 
        Error files
    Returns:
        sentences (lst): all sentences, cleaned
    '''
    abbrevs= None
    min_num_words = 5
    text = pdf_conv['text']
    preprocessed_text = preprocess_english_text(text)
    sents = get_nltk_sents(preprocessed_text, tokenizer, abbrevs)
    postprocessed_sents = remove_short_sents(sents, min_num_words)
    return postprocessed_sents

def main():
    x = get_pdf_text('uploads/Carbon_Budgets.pdf')
    EN_TOKENIZER = nltk.data.load("tokenizers/punkt/english.pickle")
    y = get_clean_eng_sents(x, EN_TOKENIZER)
    print(y)

if __name__ == '__main__':
    main()