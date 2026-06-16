"""
Docxp — Sistema de Gestión y Emisión de Documentos con IA
FastAPI Application Entry Point
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import engine, Base
from app.api.routes import excel, templates, documents
from app.services.ai_service import ai_service

# Configure logging
logging.basicConfig(
    level=logging.INFO if settings.DEBUG else logging.WARNING,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("docxp")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown events."""
    # Startup
    logger.info("🚀 Docxp starting up...")

    # Create database tables
    Base.metadata.create_all(bind=engine)
    logger.info("✅ Database tables created/verified")

    # Ensure required directories exist
    settings.upload_path
    settings.generated_path
    settings.templates_path
    logger.info("✅ File directories verified")

    # Check AI service
    health = await ai_service.check_health()
    if health["status"] == "connected":
        logger.info(f"✅ DeepSeek AI connected (model: {health['configured_model']})")
    else:
        logger.warning(
            f"⚠️  DeepSeek AI: {health.get('error', 'not available')} — "
            "La generación con IA no estará disponible hasta configurar la API key."
        )

    yield

    # Shutdown
    logger.info("🛑 Docxp shutting down...")


# Create FastAPI application
app = FastAPI(
    title="Docxp API",
    description=(
        "Sistema de Gestión y Emisión de Documentos con Inteligencia Artificial. "
        "Gestiona plantillas, extrae datos de Excel, genera contenido con DeepSeek AI, "
        "y produce documentos Word profesionales."
    ),
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.FRONTEND_URL,
        "http://localhost:5173",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(excel.router, prefix="/api")
app.include_router(templates.router, prefix="/api")
app.include_router(documents.router, prefix="/api")


@app.get("/", tags=["Health"])
def root():
    """Root endpoint — application info."""
    return {
        "name": "Docxp",
        "description": "Sistema de Gestión y Emisión de Documentos con IA",
        "version": "1.0.0",
        "docs": "/docs",
    }


@app.get("/api/health", tags=["Health"])
async def health_check():
    """Health check endpoint with AI service status."""
    ai_health = await ai_service.check_health()
    return {
        "status": "ok",
        "ai_service": ai_health,
    }
