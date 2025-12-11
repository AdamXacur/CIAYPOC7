import logging
import google.generativeai as genai
from app.core.config import settings

logger = logging.getLogger(__name__)

class EmbeddingService:
    def __init__(self):
        if settings.GOOGLE_API_KEY:
            genai.configure(api_key=settings.GOOGLE_API_KEY)
            self.model_name = "models/gemini-embedding-001"
            logger.info("✅ Servicio de Embeddings Google configurado.")
        else:
            logger.warning("⚠️ GOOGLE_API_KEY no encontrada. Los embeddings fallarán.")

    def get_embedding(self, text: str, task_type: str = "retrieval_document"):
        """
        Genera embedding usando Google Gemini API.
        task_type puede ser: 'retrieval_document' (para guardar) o 'retrieval_query' (para buscar)
        """
        try:
            # Limpiamos el texto para evitar errores de API
            clean_text = text.replace("\n", " ")
            
            result = genai.embed_content(
                model=self.model_name,
                content=clean_text,
                task_type=task_type,
                output_dimensionality=768 # Forzamos 768 para ahorrar espacio en BD
            )
            return result['embedding']
        except Exception as e:
            logger.error(f"❌ Error generando embedding con Google: {e}")
            return None

embedding_service = EmbeddingService()