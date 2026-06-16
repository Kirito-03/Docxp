from datetime import datetime
from typing import Any
from pydantic import BaseModel, Field


class FieldFormat(BaseModel):
    """Formatting rules for a single template variable."""
    zfill: int | None = Field(default=None, description="Pad with leading zeros to this total width")
    counter_start: int | None = Field(default=None, description="Auto-increment counter starting at this value")
    counter_step: int | None = Field(default=1, description="Step between counter values (default 1)")


class DocumentBase(BaseModel):
    """Base schema for document data."""

    title: str = Field(..., min_length=1, max_length=500)
    template_id: str | None = None


class GenerateRequest(BaseModel):
    """Request body for document generation."""

    template_id: str
    title: str = Field(..., min_length=1, max_length=500)
    excel_data: dict | None = None
    ai_prompt: str | None = Field(
        default=None,
        description="Custom instructions for AI content generation",
    )
    custom_fields: dict | None = Field(
        default=None,
        description="Additional key-value pairs to inject into the template",
    )
    field_formats: dict[str, FieldFormat] | None = Field(
        default=None,
        description="Formatting rules per variable (e.g. zfill)",
    )


class PreviewRequest(BaseModel):
    """Request body for document preview."""

    template_id: str
    excel_data: dict | None = None
    ai_prompt: str | None = None
    custom_fields: dict | None = None
    field_formats: dict[str, FieldFormat] | None = None


class DocumentResponse(BaseModel):
    """Schema for document API responses."""

    id: str
    template_id: str | None
    title: str
    excel_data: dict | None
    ai_prompt: str | None
    ai_response: str | None
    content_html: str | None
    generated_file_path: str | None
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


class DocumentListResponse(BaseModel):
    """Paginated list of documents."""

    items: list[DocumentResponse]
    total: int


class ExcelDataResponse(BaseModel):
    """Response from Excel file processing."""

    filename: str
    sheets: list[str]
    headers: dict[str, list[str]]
    data: dict[str, list[dict]]
    row_count: dict[str, int]
    summary: dict | None = None
