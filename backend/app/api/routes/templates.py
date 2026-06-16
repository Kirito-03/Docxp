"""Template management CRUD endpoints."""

from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.schemas.template import (
    TemplateCreate,
    TemplateUpdate,
    TemplateResponse,
    TemplateListResponse,
)
from app.services.template_service import TemplateService
from app.services.document_service import DocumentService

router = APIRouter(prefix="/templates", tags=["Templates"])


@router.get("/", response_model=TemplateListResponse)
def list_templates(
    skip: int = 0,
    limit: int = 50,
    category: str | None = None,
    db: Session = Depends(get_db),
):
    """List all templates with optional category filter."""
    items, total = TemplateService.get_templates(db, skip, limit, category)
    return TemplateListResponse(
        items=[TemplateResponse.model_validate(t) for t in items],
        total=total,
    )


@router.get("/{template_id}", response_model=TemplateResponse)
def get_template(template_id: str, db: Session = Depends(get_db)):
    """Get a single template by ID."""
    template = TemplateService.get_template(db, template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Plantilla no encontrada")
    return TemplateResponse.model_validate(template)


@router.post("/", response_model=TemplateResponse, status_code=201)
async def create_template(
    file: UploadFile = File(...),
    name: str = Form(...),
    description: str = Form(default=""),
    category: str = Form(default="carta"),
    ai_instructions: str = Form(default=""),
    replacement_rules: str | None = Form(default=None),
    db: Session = Depends(get_db),
):
    """
    Create a new template by uploading a .docx file with metadata.
    Applies replacement rules if provided via the visual mapper.
    """
    # Save the uploaded file
    file_path = await TemplateService.save_template_file(file)

    # Apply text replacements if rules exist
    if replacement_rules:
        from app.services.docx_modifier_service import DocxModifierService
        DocxModifierService.apply_replacements(file_path, replacement_rules)

    # Create database record
    template_data = TemplateCreate(
        name=name,
        description=description or None,
        category=category,
        ai_instructions=ai_instructions or None,
    )
    template = TemplateService.create_template(db, template_data, file_path)
    return TemplateResponse.model_validate(template)


@router.get("/{template_id}/variables")
def get_template_variables(template_id: str, db: Session = Depends(get_db)):
    """Get the placeholder variables defined in a template."""
    template = TemplateService.get_template(db, template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Plantilla no encontrada")

    # Fix OS path separators for Docker (Linux) if saved on Windows
    safe_path = template.file_path.replace("\\", "/")
    variables = DocumentService.get_template_variables(safe_path)
    return {"template_id": template_id, "variables": variables}


@router.put("/{template_id}", response_model=TemplateResponse)
def update_template(
    template_id: str,
    data: TemplateUpdate,
    db: Session = Depends(get_db),
):
    """Update template metadata (not the file)."""
    template = TemplateService.update_template(db, template_id, data)
    if not template:
        raise HTTPException(status_code=404, detail="Plantilla no encontrada")
    return TemplateResponse.model_validate(template)


@router.delete("/{template_id}", status_code=204)
def delete_template(template_id: str, db: Session = Depends(get_db)):
    """Delete a template and its associated file."""
    deleted = TemplateService.delete_template(db, template_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Plantilla no encontrada")
