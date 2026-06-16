"""Excel data extraction service using pandas."""

import io
import logging

import pandas as pd
from fastapi import UploadFile

logger = logging.getLogger(__name__)


class ExcelService:
    """Handles Excel file reading and data extraction."""

    @staticmethod
    async def get_sheet_names(file: UploadFile) -> list[str]:
        """Return a list of sheet names from an uploaded Excel file."""
        contents = await file.read()
        buffer = io.BytesIO(contents)
        excel_file = pd.ExcelFile(buffer, engine="openpyxl")
        return excel_file.sheet_names

    @staticmethod
    async def extract_data(file: UploadFile, sheet_name: str | None = None) -> dict:
        """
        Read an uploaded Excel file and extract structured data.

        Returns a dict with:
          - filename: original filename
          - sheets: list of sheet names
          - headers: {sheet_name: [column_names]}
          - data: {sheet_name: [row_dicts]}
          - row_count: {sheet_name: count}
          - summary: basic stats for numeric columns
        """
        try:
            contents = await file.read()
            buffer = io.BytesIO(contents)

            # Read all sheets
            excel_file = pd.ExcelFile(buffer, engine="openpyxl")
            sheet_names = excel_file.sheet_names

            result = {
                "filename": file.filename or "unknown.xlsx",
                "sheets": sheet_names,
                "headers": {},
                "data": {},
                "row_count": {},
                "summary": {},
            }
            
            sheets_to_process = [sheet_name] if sheet_name and sheet_name in sheet_names else sheet_names

            for sheet in sheets_to_process:
                buffer.seek(0)  # Reset buffer position before each read
                df = pd.read_excel(buffer, sheet_name=sheet, engine="openpyxl")

                # Drop completely empty rows and columns
                df = df.dropna(how="all", axis=0).dropna(how="all", axis=1)

                if df.empty:
                    continue

                # Auto-detect headers if they are pushed down
                unnamed_cols = [c for c in df.columns if str(c).startswith("Unnamed")]
                if len(unnamed_cols) >= len(df.columns) / 2:
                    # Find the row with the maximum number of non-null values
                    best_row_idx = df.notnull().sum(axis=1).idxmax()
                    if pd.notna(best_row_idx):
                        new_header = df.loc[best_row_idx].fillna("").astype(str).str.strip()
                        df.columns = new_header
                        df = df.loc[best_row_idx + 1:].reset_index(drop=True)
                        # Keep only columns with a non-empty name
                        valid_cols = [c for c in df.columns if c != ""]
                        df = df[valid_cols]

                # Clean column names
                df.columns = [str(col).strip() for col in df.columns]

                # Remove completely empty rows
                df = df.dropna(how="all", axis=0)

                # Convert NaN to None for JSON serialization
                df = df.where(pd.notnull(df), None)

                # Extra check: do not include columns named 'Unnamed: X'
                valid_columns = [col for col in df.columns if not col.startswith("Unnamed")]
                df = df[valid_columns]

                result["headers"][sheet] = list(df.columns)
                result["data"][sheet] = df.to_dict(orient="records")
                result["row_count"][sheet] = len(df)

                # Generate summary for numeric columns
                numeric_cols = df.select_dtypes(include=["number"]).columns.tolist()
                if numeric_cols:
                    summary = df[numeric_cols].describe().to_dict()
                    # Convert numpy types to native Python types
                    clean_summary = {}
                    for col, stats in summary.items():
                        clean_summary[col] = {
                            k: float(v) if v is not None else None
                            for k, v in stats.items()
                        }
                    result["summary"][sheet] = clean_summary

            logger.info(
                f"Extracted data from '{file.filename}': "
                f"{len(sheet_names)} sheets, "
                f"{sum(result['row_count'].values())} total rows"
            )
            return result

        except Exception as e:
            logger.error(f"Error extracting Excel data: {e}")
            raise ValueError(f"Error processing Excel file: {str(e)}")

    @staticmethod
    def prepare_context_for_ai(excel_data: dict, sheet_name: str | None = None) -> str:
        """
        Convert extracted Excel data into a structured text context
        suitable for AI processing.
        """
        lines = []
        sheets_to_process = (
            [sheet_name] if sheet_name else excel_data.get("sheets", [])
        )

        for sheet in sheets_to_process:
            data = excel_data.get("data", {}).get(sheet, [])
            headers = excel_data.get("headers", {}).get(sheet, [])

            if not data:
                continue

            lines.append(f"## Hoja: {sheet}")
            lines.append(f"Columnas: {', '.join(headers)}")
            lines.append(f"Total de filas: {len(data)}")
            lines.append("")

            # Include first 20 rows as context (avoid overwhelming the AI)
            for i, row in enumerate(data[:20]):
                row_text = " | ".join(
                    f"{k}: {v}" for k, v in row.items() if v is not None
                )
                lines.append(f"  Fila {i + 1}: {row_text}")

            if len(data) > 20:
                lines.append(f"  ... ({len(data) - 20} filas adicionales omitidas)")

            lines.append("")

        return "\n".join(lines)
