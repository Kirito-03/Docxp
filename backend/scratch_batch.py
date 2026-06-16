@router.post("/generate/batch")
async def generate_batch(data: GenerateRequest, db: Session = Depends(get_db)):
    """
    Generate multiple documents based on Excel rows and pack them in a ZIP.
    Bypasses AI generation for speed.
    """
    import zipfile
    import io

    template = TemplateService.get_template(db, data.template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Plantilla no encontrada")

    if not data.excel_data or not data.excel_data.get("data"):
        raise HTTPException(status_code=400, detail="No hay datos de Excel para el modo masivo")

    first_sheet = list(data.excel_data["data"].keys())[0]
    rows = data.excel_data["data"][first_sheet]

    if not rows:
        raise HTTPException(status_code=400, detail="El Excel está vacío")

    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
        for idx, row in enumerate(rows, start=1):
            context = {}
            # Map user custom fields to excel row values
            for key, mapped_val in (data.custom_fields or {}).items():
                if mapped_val in row:
                    context[key] = str(row[mapped_val] or "")
                else:
                    context[key] = mapped_val  # literal string

            # Generate document
            buffer, _ = DocumentService.generate_document(
                template_path=template.file_path,
                context=context,
                output_filename="temp.docx"
            )
            
            # Name the file
            filename = f"Documento_Fila_{idx}.docx"
            zip_file.writestr(filename, buffer.getvalue())

    zip_buffer.seek(0)
    
    return StreamingResponse(
        zip_buffer,
        media_type="application/zip",
        headers={
            "Content-Disposition": 'attachment; filename="documentos_lote.zip"'
        }
    )
