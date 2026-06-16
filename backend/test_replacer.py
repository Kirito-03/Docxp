import json
from app.services.docx_modifier_service import DocxModifierService
import shutil

# Copy test template
shutil.copy("plantilla_prueba.docx", "test_out.docx")

# Run replacer
rules = [{"search": "Nombre", "replace": "{{ nombre }}"}]
rules_json = json.dumps(rules)

try:
    DocxModifierService.apply_replacements("test_out.docx", rules_json)
    print("Success")
except Exception as e:
    print(f"Error: {e}")
