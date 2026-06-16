"""AI integration service using DeepSeek API (OpenAI-compatible)."""

import logging

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

# System prompts per document category
SYSTEM_PROMPTS = {
    "carta": (
        "Eres un asistente experto en redacción formal de cartas oficiales y "
        "correspondencia institucional. Redacta el contenido de forma profesional, "
        "clara y concisa, respetando el formato estándar de cartas formales en español."
    ),
    "informe": (
        "Eres un asistente experto en redacción de informes técnicos y ejecutivos. "
        "Organiza la información de manera lógica con secciones claras, incluyendo "
        "resumen ejecutivo, análisis de datos, hallazgos y conclusiones."
    ),
    "acta": (
        "Eres un asistente experto en redacción de actas de reunión y documentos "
        "oficiales. Registra los puntos tratados, acuerdos y compromisos de forma "
        "objetiva y estructurada, siguiendo el formato estándar de actas."
    ),
    "otro": (
        "Eres un asistente experto en redacción de documentos profesionales. "
        "Adapta el contenido al formato solicitado, manteniendo un tono profesional "
        "y una estructura clara."
    ),
}


class AIService:
    """Handles communication with DeepSeek for AI-powered content generation."""

    def __init__(self):
        self.base_url = settings.DEEPSEEK_BASE_URL
        self.api_key = settings.DEEPSEEK_API_KEY
        self.model = settings.DEEPSEEK_MODEL
        self.timeout = httpx.Timeout(120.0, connect=10.0)

    def _get_headers(self) -> dict:
        """Build authorization headers for DeepSeek API."""
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

    async def generate_content(
        self,
        context: str,
        user_prompt: str,
        category: str = "otro",
        template_instructions: str | None = None,
    ) -> str:
        """
        Generate document content using DeepSeek.

        Args:
            context: Structured text from Excel data
            user_prompt: User's specific instructions
            category: Document category for system prompt selection
            template_instructions: Additional instructions from the template

        Returns:
            Generated text content
        """
        system_prompt = SYSTEM_PROMPTS.get(category, SYSTEM_PROMPTS["otro"])

        if template_instructions:
            system_prompt += (
                f"\n\nInstrucciones específicas de la plantilla:\n"
                f"{template_instructions}"
            )

        full_prompt = self._build_prompt(context, user_prompt)

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.base_url}/v1/chat/completions",
                    headers=self._get_headers(),
                    json={
                        "model": self.model,
                        "messages": [
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": full_prompt},
                        ],
                        "temperature": 0.7,
                        "top_p": 0.9,
                        "max_tokens": 4096,
                        "stream": False,
                    },
                )
                response.raise_for_status()
                result = response.json()

                generated_text = (
                    result.get("choices", [{}])[0]
                    .get("message", {})
                    .get("content", "")
                )

                usage = result.get("usage", {})
                logger.info(
                    f"AI generation complete. Model: {self.model}, "
                    f"Prompt tokens: {usage.get('prompt_tokens', 'N/A')}, "
                    f"Completion tokens: {usage.get('completion_tokens', 'N/A')}"
                )
                return generated_text

        except httpx.ConnectError:
            logger.error(f"Cannot connect to DeepSeek at {self.base_url}")
            raise ConnectionError(
                f"No se pudo conectar con DeepSeek en {self.base_url}. "
                "Verifica tu conexión a internet."
            )
        except httpx.HTTPStatusError as e:
            logger.error(f"DeepSeek API error: {e.response.status_code}")
            if e.response.status_code == 401:
                raise RuntimeError(
                    "API Key de DeepSeek inválida. Verifica DEEPSEEK_API_KEY en .env"
                )
            raise RuntimeError(f"Error de la API de DeepSeek: {e.response.text}")
        except Exception as e:
            logger.error(f"Unexpected error during AI generation: {e}")
            raise RuntimeError(f"Error inesperado en generación de IA: {str(e)}")

    async def check_health(self) -> dict:
        """Check if DeepSeek API is accessible."""
        if not self.api_key:
            return {
                "status": "not_configured",
                "error": "DEEPSEEK_API_KEY no configurada en .env",
                "configured_model": self.model,
            }

        try:
            async with httpx.AsyncClient(timeout=httpx.Timeout(10.0)) as client:
                response = await client.get(
                    f"{self.base_url}/v1/models",
                    headers=self._get_headers(),
                )
                response.raise_for_status()
                models = response.json().get("data", [])
                model_ids = [m.get("id", "") for m in models]

                return {
                    "status": "connected",
                    "model_available": self.model in model_ids,
                    "available_models": model_ids,
                    "configured_model": self.model,
                }
        except Exception as e:
            return {
                "status": "error",
                "error": str(e),
                "configured_model": self.model,
            }

    @staticmethod
    def _build_prompt(context: str, user_prompt: str) -> str:
        """Build the full prompt combining context and user instructions."""
        parts = []

        if context:
            parts.append(
                "A continuación se presentan los datos extraídos de un archivo Excel "
                "que debes utilizar como contexto para generar el documento:\n\n"
                f"{context}\n"
            )

        if user_prompt:
            parts.append(f"Instrucciones del usuario:\n{user_prompt}\n")

        parts.append(
            "\nGenera el contenido del documento basándote en los datos "
            "y las instrucciones proporcionadas. El contenido debe estar listo "
            "para insertarse en una plantilla de documento formal."
        )

        return "\n".join(parts)


# Singleton instance
ai_service = AIService()
