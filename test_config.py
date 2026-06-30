# test_config.py
import os
from config import ODOO_BASE, ODOO_DB

print("--- ENV CHECK ---")
print("OS Environ ODOO_BASE:", os.environ.get("ODOO_BASE"))
print("Loaded ODOO_BASE:", ODOO_BASE)
print("Loaded ODOO_DB:", ODOO_DB)

