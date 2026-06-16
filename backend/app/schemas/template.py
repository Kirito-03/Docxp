from datetime import datetime
from pydantic import BaseModel, Field


class TemplateBase(BaseModel):
    """Base schema for template data."""

    name: str = Field(..., min_length=1, max_length=255)
    description: str | None = None
    category: str = Field(default="carta", pattern="^(carta|informe|acta|otro)$")
    ai_instructions: str | None = None


class TemplateCreate(TemplateBase):
    """Schema for creating a new template (file uploaded separately)."""
    pass


class TemplateUpdate(BaseModel):
    """Schema for updating an existing template."""

    name: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None
    category: str | None = Field(default=None, pattern="^(carta|informe|acta|otro)$")
    ai_instructions: str | None = None


class TemplateResponse(TemplateBase):
    """Schema for template API responses."""

    id: str
    file_path: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class TemplateListResponse(BaseModel):
    """Paginated list of templates."""

    items: list[TemplateResponse]
    total: int
