"""Template management service."""

import logging
import shutil
import uuid
from pathlib import Path

from fastapi import UploadFile
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.template import Template
from app.schemas.template import TemplateCreate, TemplateUpdate

logger = logging.getLogger(__name__)


class TemplateService:
    """Business logic for template management."""

    @staticmethod
    async def save_template_file(file: UploadFile) -> str:
        """Save an uploaded template file and return the path."""
        if not file.filename or not file.filename.endswith(".docx"):
            raise ValueError("Solo se permiten archivos .docx como plantillas")

        file_id = uuid.uuid4().hex[:12]
        filename = f"{file_id}_{file.filename}"
        file_path = settings.templates_path / filename

        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)

        logger.info(f"Template file saved: {file_path}")
        return str(file_path)

    @staticmethod
    def create_template(
        db: Session, data: TemplateCreate, file_path: str
    ) -> Template:
        """Create a new template record in the database."""
        template = Template(
            name=data.name,
            description=data.description,
            category=data.category,
            ai_instructions=data.ai_instructions,
            file_path=file_path,
        )
        db.add(template)
        db.commit()
        db.refresh(template)
        logger.info(f"Template created: {template.id} - {template.name}")
        return template

    @staticmethod
    def get_templates(
        db: Session, skip: int = 0, limit: int = 50, category: str | None = None
    ) -> tuple[list[Template], int]:
        """List templates with optional category filter."""
        query = db.query(Template)
        if category:
            query = query.filter(Template.category == category)

        total = query.count()
        items = (
            query.order_by(Template.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )
        return items, total

    @staticmethod
    def get_template(db: Session, template_id: str) -> Template | None:
        """Get a single template by ID."""
        return db.query(Template).filter(Template.id == template_id).first()

    @staticmethod
    def update_template(
        db: Session, template_id: str, data: TemplateUpdate
    ) -> Template | None:
        """Update an existing template."""
        template = db.query(Template).filter(Template.id == template_id).first()
        if not template:
            return None

        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(template, key, value)

        db.commit()
        db.refresh(template)
        logger.info(f"Template updated: {template.id}")
        return template

    @staticmethod
    def delete_template(db: Session, template_id: str) -> bool:
        """Delete a template and its file."""
        template = db.query(Template).filter(Template.id == template_id).first()
        if not template:
            return False

        # Remove file from disk
        file_path = Path(template.file_path)
        if file_path.exists():
            file_path.unlink()

        db.delete(template)
        db.commit()
        logger.info(f"Template deleted: {template_id}")
        return True
