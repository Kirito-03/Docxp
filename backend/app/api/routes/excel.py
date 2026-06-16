"""Excel upload and data extraction endpoints."""

from fastapi import APIRouter, UploadFile, File, Form, HTTPException

from app.schemas.document import ExcelDataResponse
from app.services.excel_service import ExcelService

router = APIRouter(prefix="/excel", tags=["Excel"])

@router.post("/sheets")
async def get_excel_sheets(file: UploadFile = File(...)):
    """
    Rápido: lee solo el archivo Excel y devuelve los nombres de las hojas.
    """
    if not file.filename or not file.filename.endswith((".xlsx", ".xls")):
        raise HTTPException(
            status_code=400,
            detail="Solo se permiten archivos Excel (.xlsx, .xls)",
        )
    
    try:
        sheets = await ExcelService.get_sheet_names(file)
        return {"sheets": sheets}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error leyendo hojas del archivo: {str(e)}",
        )

@router.post("/upload", response_model=ExcelDataResponse)
async def upload_excel(file: UploadFile = File(...), sheet_name: str | None = Form(None)):
    """
    Upload an Excel file (.xlsx) and extract its data.

    Returns structured data including headers, rows, and statistical summary
    for each sheet in the workbook.
    """
    if not file.filename or not file.filename.endswith((".xlsx", ".xls")):
        raise HTTPException(
            status_code=400,
            detail="Solo se permiten archivos Excel (.xlsx, .xls)",
        )

    try:
        data = await ExcelService.extract_data(file, sheet_name)
        return ExcelDataResponse(**data)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error procesando el archivo: {str(e)}",
        )


@router.post("/prepare-context")
async def prepare_ai_context(
    file: UploadFile = File(...),
    sheet_name: str | None = None,
):
    """
    Upload an Excel file and prepare a text context suitable for AI processing.

    Optionally specify a sheet_name to extract data from a single sheet.
    """
    if not file.filename or not file.filename.endswith((".xlsx", ".xls")):
        raise HTTPException(
            status_code=400,
            detail="Solo se permiten archivos Excel (.xlsx, .xls)",
        )

    try:
        excel_data = await ExcelService.extract_data(file)
        context_text = ExcelService.prepare_context_for_ai(excel_data, sheet_name)
        return {
            "filename": excel_data["filename"],
            "sheets_processed": [sheet_name] if sheet_name else excel_data["sheets"],
            "context": context_text,
            "context_length": len(context_text),
        }
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

@router.post("/columns")
async def get_excel_columns(file: UploadFile = File(...), sheet_name: str | None = Form(None)):
    """
    Rápido: lee solo la cabecera del Excel y devuelve los nombres de las columnas.
    """
    if not file.filename or not file.filename.endswith((".xlsx", ".xls")):
        raise HTTPException(
            status_code=400,
            detail="Solo se permiten archivos Excel (.xlsx, .xls)",
        )
    
    try:
        data = await ExcelService.extract_data(file, sheet_name)
        unique_columns = []
        for sheet, headers in data.get("headers", {}).items():
            for col in headers:
                if col not in unique_columns:
                    unique_columns.append(col)
                
        return {"columns": unique_columns}
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error leyendo columnas del archivo: {str(e)}",
        )
