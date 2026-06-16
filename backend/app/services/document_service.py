"""Document generation service using docxtpl."""

import io
import logging
import uuid
from datetime import datetime
from pathlib import Path

from docxtpl import DocxTemplate

from app.core.config import settings

logger = logging.getLogger(__name__)


class DocumentService:
    """Handles document generation and preview."""

    @staticmethod
    def generate_document(
        template_path: str,
        context: dict,
        output_filename: str | None = None,
    ) -> tuple[io.BytesIO, str]:
        """
        Render a .docx template with the provided context.

        Args:
            template_path: Path to the .docx template file
            context: Dictionary of values to inject into the template
            output_filename: Optional name for the output file

        Returns:
            Tuple of (BytesIO buffer with generated doc, output filename)
        """
        try:
            doc = DocxTemplate(template_path)
            doc.render(context)

            buffer = io.BytesIO()
            doc.save(buffer)
            buffer.seek(0)

            if not output_filename:
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                output_filename = f"doc_{timestamp}_{uuid.uuid4().hex[:8]}.docx"

            logger.info(f"Document generated: {output_filename}")
            return buffer, output_filename

        except Exception as e:
            logger.error(f"Error generating document: {e}")
            raise RuntimeError(f"Error generando documento: {str(e)}")

    @staticmethod
    def save_document(buffer: io.BytesIO, filename: str) -> str:
        """Save a generated document to the generated directory."""
        output_path = settings.generated_path / filename
        with open(output_path, "wb") as f:
            f.write(buffer.getvalue())
        logger.info(f"Document saved to: {output_path}")
        return str(output_path)

    @staticmethod
    def generate_preview_html(
        ai_content: str,
        template_name: str = "",
        title: str = "",
        excel_summary: dict | None = None,
    ) -> str:
        """
        Generate an HTML preview of the document content.
        This provides a real-time preview before final document generation.
        """
        # Convert line breaks to HTML paragraphs
        paragraphs = ai_content.split("\n\n") if ai_content else []
        content_html = ""
        for p in paragraphs:
            p = p.strip()
            if not p:
                continue
            # Detect headers (lines starting with #)
            if p.startswith("###"):
                content_html += f'<h4 style="color:#DC2626;margin:16px 0 8px;">{p.lstrip("# ")}</h4>'
            elif p.startswith("##"):
                content_html += f'<h3 style="color:#DC2626;margin:20px 0 10px;">{p.lstrip("# ")}</h3>'
            elif p.startswith("#"):
                content_html += f'<h2 style="color:#DC2626;margin:24px 0 12px;">{p.lstrip("# ")}</h2>'
            elif p.startswith("- ") or p.startswith("* "):
                items = p.split("\n")
                content_html += "<ul style='margin:8px 0;padding-left:24px;'>"
                for item in items:
                    item_text = item.lstrip("-* ").strip()
                    if item_text:
                        content_html += f"<li style='margin:4px 0;'>{item_text}</li>"
                content_html += "</ul>"
            else:
                content_html += f'<p style="margin:8px 0;line-height:1.7;">{p}</p>'

        html = f"""
        <div style="
            font-family: 'Georgia', 'Times New Roman', serif;
            max-width: 210mm;
            margin: 0 auto;
            padding: 40px 50px;
            background: #1a1a1a;
            color: #e0e0e0;
            border: 1px solid #333;
            border-radius: 4px;
            min-height: 297mm;
            box-shadow: 0 4px 24px rgba(220,38,38,0.1);
        ">
            <div style="
                border-bottom: 2px solid #DC2626;
                padding-bottom: 16px;
                margin-bottom: 24px;
            ">
                <h1 style="
                    margin: 0;
                    font-size: 22px;
                    color: #ffffff;
                    letter-spacing: 1px;
                ">{title or 'Documento Sin Título'}</h1>
                <p style="
                    margin: 8px 0 0;
                    font-size: 12px;
                    color: #888;
                ">Plantilla: {template_name} | Generado: {datetime.now().strftime('%d/%m/%Y %H:%M')}</p>
            </div>

            <div style="font-size: 14px;">
                {content_html or '<p style="color:#666;font-style:italic;">Contenido pendiente de generación...</p>'}
            </div>

            <div style="
                border-top: 1px solid #333;
                margin-top: 40px;
                padding-top: 16px;
                font-size: 11px;
                color: #666;
                text-align: center;
            ">
                Generado por Docxp — Sistema de Gestión de Documentos
            </div>
        </div>
        """
        return html

    @staticmethod
    def get_template_variables(template_path: str) -> list[str]:
        """Extract variable names from a .docx template."""
        try:
            doc = DocxTemplate(template_path)
            variables = doc.get_undeclared_template_variables()
            return sorted(list(variables))
        except Exception as e:
            logger.error(f"Error reading template variables: {e}")
            return []
