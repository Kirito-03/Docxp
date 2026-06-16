<div align="center">

<img src="frontend/public/favicon.svg" alt="Docxp Logo" width="80" height="80" />

# ⚡ Docxp

**Sistema de Gestión y Emisión de Documentos con Inteligencia Artificial**

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com)
[![DeepSeek](https://img.shields.io/badge/AI-DeepSeek-FF6B35?style=for-the-badge&logo=openai&logoColor=white)](https://www.deepseek.com)

*Automatiza la generación masiva de documentos Word a partir de plantillas .docx y datos de Excel, potenciado con IA.*

---

</div>

## 📋 Tabla de Contenidos

- [¿Qué es Docxp?](#-qué-es-docxp)
- [Características](#-características)
- [Arquitectura](#-arquitectura)
- [Stack Tecnológico](#-stack-tecnológico)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Instalación Rápida (Docker)](#-instalación-rápida-docker)
- [Instalación Manual (Desarrollo)](#-instalación-manual-desarrollo)
- [Variables de Entorno](#-variables-de-entorno)
- [API Reference](#-api-reference)
- [Flujo de Uso](#-flujo-de-uso)
- [Formateo de Variables](#-formateo-de-variables)
- [Autor](#-autor)

---

## 🎯 ¿Qué es Docxp?

**Docxp** es una aplicación web full-stack diseñada para automatizar la emisión masiva de documentos Word (`.docx`). Combina:

- 📄 **Plantillas .docx** con variables Jinja2 (`{{ variable }}`)
- 📊 **Datos de Excel** con soporte para múltiples hojas/pestañas
- 🤖 **IA Generativa** (DeepSeek) para redactar el cuerpo del documento
- 🗂️ **Generación Masiva** en ZIP, una fila = un documento

Ideal para generar contratos, cartas, informes, actas u cualquier documento formal en lote.

---

## ✨ Características

| Feature | Descripción |
|---|---|
| 🗂️ **Gestión de Plantillas** | Sube plantillas `.docx` con variables Jinja2 e instrucciones de IA personalizadas |
| 📊 **Carga de Excel Multi-Hoja** | Detecta automáticamente todas las pestañas y permite seleccionar la hoja a procesar |
| 🔗 **Mapeo Visual de Variables** | Conecta cada variable de la plantilla a una columna del Excel o escribe texto fijo |
| 🔢 **Formateo de Columnas** | Aplica `zfill` (relleno de ceros) u otros formatos antes de inyectar al documento |
| 🤖 **Generación con IA** | DeepSeek genera el contenido del campo `{{ contenido }}` según el contexto del Excel |
| 👁️ **Vista Previa HTML** | Previsualiza el documento renderizado antes de generarlo |
| ⚡ **Generación Individual** | Genera un único `.docx` guardado en la base de datos |
| 📦 **Generación Masiva (ZIP)** | Selecciona filas del Excel con checkboxes → descarga ZIP con N documentos |
| 📜 **Historial** | Registro de todos los documentos generados con opción de descarga |
| 🐳 **Docker Ready** | Entorno completo con `docker-compose` (backend + frontend + PostgreSQL) |

---

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────┐
│                     CLIENTE (Browser)                   │
│          React 19 + TypeScript + Ant Design 6           │
│              Vite 8 · React Router 7 · Axios            │
└────────────────────────┬────────────────────────────────┘
                         │ HTTP / REST
                         ▼
┌─────────────────────────────────────────────────────────┐
│               BACKEND  (FastAPI 0.115)                  │
│                                                         │
│  ┌──────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │  /excel  │  │  /templates  │  │    /documents     │  │
│  │ /sheets  │  │   CRUD       │  │ preview/generate  │  │
│  │ /upload  │  │              │  │ batch-generate    │  │
│  │ /columns │  └──────────────┘  └───────────────────┘  │
│  └──────────┘                                           │
│                                                         │
│  ┌──────────────┐  ┌────────────┐  ┌────────────────┐   │
│  │ ExcelService │  │ AIService  │  │DocumentService │   │
│  │  (Pandas)    │  │ (DeepSeek) │  │  (docxtpl)     │   │
│  └──────────────┘  └────────────┘  └────────────────┘   │
└────────────┬────────────────────────────────────────────┘
             │ SQLAlchemy ORM
             ▼
┌─────────────────────┐      ┌────────────────────────────┐
│   PostgreSQL 16      │      │     Sistema de Archivos    │
│   docxp_db           │      │  /uploads  /templates      │
│  (documentos, meta)  │      │  /generated (.docx, .zip)  │
└─────────────────────┘      └────────────────────────────┘
             │ httpx
             ▼
┌─────────────────────┐
│   DeepSeek AI API   │
│  deepseek-chat model │
└─────────────────────┘
```

---

## 🛠️ Stack Tecnológico

### Backend
| Paquete | Versión | Uso |
|---|---|---|
| `fastapi` | 0.115.12 | Framework API REST |
| `uvicorn` | 0.34.3 | Servidor ASGI |
| `sqlalchemy` | 2.0.41 | ORM / base de datos |
| `alembic` | 1.16.1 | Migraciones de BD |
| `psycopg2-binary` | 2.9.10 | Driver PostgreSQL |
| `pandas` | 2.2.3 | Procesamiento de Excel |
| `openpyxl` | 3.1.5 | Lectura de `.xlsx` |
| `docxtpl` | 0.19.0 | Renderizado de plantillas Word |
| `httpx` | 0.28.1 | Cliente HTTP para DeepSeek |
| `pydantic-settings` | 2.9.1 | Configuración tipada |

### Frontend
| Paquete | Versión | Uso |
|---|---|---|
| `react` | 19.2 | UI Framework |
| `typescript` | 6.0 | Tipado estático |
| `vite` | 8.0 | Build tool / Dev server |
| `antd` | 6.4 | Componentes UI |
| `@ant-design/icons` | 6.2 | Iconografía |
| `react-router-dom` | 7.17 | Enrutamiento SPA |
| `axios` | 1.18 | Cliente HTTP |
| `mammoth` | 1.12 | Preview de .docx en HTML |

---

## 📁 Estructura del Proyecto

```
Docxp/
├── docker-compose.yml              # Orquestación completa
│
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── .env.example                # Variables de entorno de ejemplo
│   └── app/
│       ├── main.py                 # Entry point FastAPI
│       ├── core/
│       │   ├── config.py           # Settings con pydantic-settings
│       │   └── database.py         # Engine SQLAlchemy
│       ├── api/
│       │   └── routes/
│       │       ├── excel.py        # /api/excel/* (sheets, upload, columns)
│       │       ├── templates.py    # /api/templates/* (CRUD)
│       │       └── documents.py    # /api/documents/* (preview, generate, batch)
│       ├── models/
│       │   ├── template.py         # Modelo ORM Template
│       │   └── document.py         # Modelo ORM Document
│       ├── schemas/
│       │   ├── template.py         # Schemas Pydantic Template
│       │   └── document.py         # Schemas + FieldFormat
│       ├── services/
│       │   ├── excel_service.py    # Extracción multi-hoja con Pandas
│       │   ├── ai_service.py       # Integración DeepSeek API
│       │   ├── document_service.py # Generación docx con docxtpl
│       │   └── template_service.py # CRUD de plantillas
│       └── utils/
│           └── file_helpers.py
│
└── frontend/
    ├── Dockerfile
    ├── package.json
    ├── vite.config.ts
    └── src/
        ├── App.tsx                 # Router principal
        ├── main.tsx
        ├── pages/
        │   ├── Dashboard.tsx       # Panel de bienvenida
        │   ├── Generator.tsx       # ⭐ Generador de documentos (core)
        │   ├── Templates.tsx       # Gestión de plantillas
        │   └── History.tsx         # Historial de documentos
        ├── components/
        │   ├── ExcelUploader/      # Upload + selector de hoja + mapeo + zfill
        │   ├── TemplateSelector/   # Selector de plantilla con búsqueda
        │   ├── DocumentPreview/    # Vista previa HTML del docx
        │   ├── TemplateEditor/     # Mapper visual de variables
        │   └── Layout/             # AppLayout con sidebar
        ├── services/
        │   └── api.ts              # Cliente Axios centralizado
        ├── hooks/
        │   └── useDocumentPreview.ts
        ├── types/
        │   └── index.ts            # Tipos TypeScript compartidos
        └── styles/
            └── index.css           # Design tokens CSS
```

---

## 🚀 Instalación Rápida (Docker)

> **Requisitos:** Docker Desktop instalado y corriendo.

```bash
# 1. Clona el repositorio
git clone https://github.com/Kirito-03/Docxp.git
cd Docxp

# 2. Configura las variables de entorno
cp backend/.env.example backend/.env
# Edita backend/.env y añade tu DEEPSEEK_API_KEY

# 3. Levanta todos los servicios
docker-compose up -d

# 4. Accede a la aplicación
# Frontend:  http://localhost:5173
# API Docs:  http://localhost:8000/docs
# PostgreSQL: localhost:5432
```

---

## 🔧 Instalación Manual (Desarrollo)

### Backend

```bash
cd backend

# Crear entorno virtual
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Linux/Mac

# Instalar dependencias
pip install -r requirements.txt

# Configurar variables de entorno
cp .env.example .env
# Edita .env con tus credenciales

# Iniciar servidor (requiere PostgreSQL corriendo)
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
# → http://localhost:5173
```

### PostgreSQL (Docker rápido)

```bash
docker run -d \
  --name docxp-db \
  -e POSTGRES_USER=docxp \
  -e POSTGRES_PASSWORD=docxp_secret_2024 \
  -e POSTGRES_DB=docxp_db \
  -p 5432:5432 \
  postgres:16-alpine
```

---

## 🔐 Variables de Entorno

Copia `backend/.env.example` a `backend/.env` y configura:

```env
# Base de datos PostgreSQL
DATABASE_URL=postgresql://docxp:docxp_secret_2024@localhost:5432/docxp_db

# DeepSeek AI  ← OBLIGATORIO para generación con IA
DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxx
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-chat

# Directorios de archivos
UPLOAD_DIR=uploads
GENERATED_DIR=generated
TEMPLATES_DIR=templates

# Servidor
HOST=0.0.0.0
PORT=8000
DEBUG=true

# CORS
FRONTEND_URL=http://localhost:5173
```

> **Nota:** La app funciona sin `DEEPSEEK_API_KEY` — puedes generar documentos con mapeo manual de variables. La IA solo es necesaria para el campo `{{ contenido }}`.

---

## 📡 API Reference

La documentación interactiva completa está disponible en:
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

### Endpoints Principales

#### Excel
| Método | Endpoint | Descripción |
|---|---|---|
| `POST` | `/api/excel/sheets` | Lista las hojas del archivo Excel |
| `POST` | `/api/excel/upload` | Extrae datos completos de una hoja |
| `POST` | `/api/excel/columns` | Obtiene solo los nombres de columnas |

#### Templates
| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/api/templates/` | Lista todas las plantillas |
| `POST` | `/api/templates/` | Sube una nueva plantilla `.docx` |
| `GET` | `/api/templates/{id}` | Obtiene una plantilla |
| `DELETE` | `/api/templates/{id}` | Elimina una plantilla |
| `GET` | `/api/templates/{id}/variables` | Detecta variables `{{ }}` en la plantilla |

#### Documents
| Método | Endpoint | Descripción |
|---|---|---|
| `POST` | `/api/documents/preview` | Genera previsualización HTML |
| `POST` | `/api/documents/generate` | Genera y guarda un documento |
| `POST` | `/api/documents/batch-generate` | Genera ZIP con N documentos (uno por fila Excel) |
| `GET` | `/api/documents/` | Lista documentos generados |
| `GET` | `/api/documents/{id}/download` | Descarga un `.docx` generado |

---

## 🔄 Flujo de Uso

```
Paso 01: Seleccionar Plantilla
    └─ Elige una plantilla .docx del listado
    └─ La app detecta automáticamente las variables {{ }}

Paso 02: Datos de Excel y Mapeo
    └─ Arrastra tu .xlsx al área de carga
    └─ Si tiene múltiples hojas → elige la pestaña a procesar
    └─ Mapea cada variable a una columna del Excel o escribe texto fijo
    └─ Opcional: configura formateo (ej. zfill=7 para "0000001")
    └─ Selecciona las filas que deseas generar (checkboxes)

Paso 03: Configuración IA y Generación
    └─ Escribe instrucciones para la IA (campo {{ contenido }})
    └─ Previsualiza → Genera Individual → Generación Masiva (ZIP)
```

---

## 🔢 Formateo de Variables

Al mapear una variable a una columna del Excel, puedes aplicar formatos especiales usando el botón **⚙️** que aparece al lado del selector:

### Ceros a la izquierda (zfill)

Útil cuando Excel almacena números que visualmente deben tener ceros (ej. códigos de orden de servicio).

| Valor en Excel | zfill | Resultado en documento |
|---|---|---|
| `1` | `7` | `0000001` |
| `42` | `7` | `0000042` |
| `1234` | `8` | `00001234` |

**Configuración:** Haz clic en ⚙️ junto a la columna → Ingresa el ancho total en dígitos → El botón se vuelve 🟢 cuando está activo.

---

## 📌 Notas de Plantillas

Las plantillas `.docx` usan sintaxis **Jinja2** compatible con `docxtpl`:

```
{{ nombre }}          → Variable simple
{{ contenido }}       → Campo generado por IA
{{ titulo }}          → Título del documento
{% for row in datos %} ... {% endfor %}  → Iteración de filas
```

---

## 🤝 Contribuciones

1. Fork del repositorio
2. Crea tu branch: `git checkout -b feature/nueva-funcionalidad`
3. Commit: `git commit -m "feat: descripción clara"`
4. Push: `git push origin feature/nueva-funcionalidad`
5. Abre un Pull Request

---

## 📄 Licencia

Este proyecto está bajo la licencia **MIT**. Consulta el archivo `LICENSE` para más detalles.

---

<div align="center">

## 👤 Autor

**Kirito**

[![GitHub](https://img.shields.io/badge/GitHub-Kirito--03-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/Kirito-03)

---

*Hecho con ⚡ por Kirito · 2026*

</div>
