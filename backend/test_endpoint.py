import httpx
import json

url = "http://localhost:8000/api/templates/"

files = {
    'file': ('test.docx', open('plantilla_prueba.docx', 'rb'), 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
}

data = {
    'name': 'Test Template',
    'description': '',
    'category': 'carta',
    'ai_instructions': '',
    'replacement_rules': json.dumps([{"search": "Nombre", "replace": "{{ nombre }}"}])
}

response = httpx.post(url, files=files, data=data)
print(response.status_code)
print(response.text)
