from datetime import datetime
from pydantic import BaseModel, Field


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


class PreviewRequest(BaseModel):
    """Request body for document preview."""

    template_id: str
    excel_data: dict | None = None
    ai_prompt: str | None = None
    custom_fields: dict | None = None


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
