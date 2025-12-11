import logging
from openai import OpenAI
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.core.config import settings
from app.services.embedding_service import embedding_service
from app.models.knowledge import KnowledgeItem

logger = logging.getLogger(__name__)

class ChatService:
    def __init__(self):
        # Cliente para DeepSeek (Compatible con API de OpenAI)
        if settings.DEEPSEEK_API_KEY:
            self.client = OpenAI(
                api_key=settings.DEEPSEEK_API_KEY,
                base_url=settings.DEEPSEEK_BASE_URL
            )
            self.model = settings.DEEPSEEK_MODEL
        else:
            self.client = None

    def search_knowledge_base(self, db: Session, query: str, limit: int = 3):
        """
        Busca los fragmentos más relevantes en la BD usando distancia coseno.
        """
        # 1. Convertir pregunta a vector (usando Google)
        query_vector = embedding_service.get_embedding(query, task_type="retrieval_query")
        
        if not query_vector:
            return []

        # 2. Búsqueda Vectorial en Postgres (pgvector)
        # El operador <=> calcula la distancia coseno (menor es mejor)
        try:
            results = db.query(KnowledgeItem).order_by(
                KnowledgeItem.embedding.cosine_distance(query_vector)
            ).limit(limit).all()
            return results
        except Exception as e:
            logger.error(f"Error en búsqueda vectorial: {e}")
            return []

    async def get_chat_response(self, db: Session, message: str):
        if not self.client:
            yield "Error: API Key de DeepSeek no configurada."
            return

        # 1. Recuperar Contexto (RAG)
        relevant_docs = self.search_knowledge_base(db, message)
        
        context_text = ""
        sources = set()
        
        if relevant_docs:
            context_text = "\n\n".join([f"--- Fragmento ---\n{doc.content}" for doc in relevant_docs])
            sources = {doc.source_filename for doc in relevant_docs if doc.source_filename}
        
        # 2. Construir Prompt del Sistema
        system_prompt = f"""
        Eres el Asistente de Soporte TI del Gobierno de Yucatán.
        Tu trabajo es ayudar a resolver problemas técnicos basándote ESTRICTAMENTE en la siguiente información de los manuales.
        
        INFORMACIÓN DE CONTEXTO:
        {context_text}
        
        INSTRUCCIONES:
        - Si la respuesta está en el contexto, explícala paso a paso.
        - Si la respuesta NO está en el contexto, di: "Lo siento, esa información no está en mis manuales actuales."
        - Sé amable, profesional y conciso.
        """

        # 3. Generar Respuesta con DeepSeek
        try:
            stream = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": message}
                ],
                stream=True,
                temperature=0.3 # Bajo para ser más preciso y menos creativo
            )
            
            for chunk in stream:
                if chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
            
            # 4. Añadir Fuentes al final (si existen)
            if sources:
                yield f"\n\n📚 *Fuente: {', '.join(sources)}*"

        except Exception as e:
            logger.error(f"Error DeepSeek Chat: {e}")
            yield "Lo siento, hubo un error de conexión con el cerebro de IA."

chat_service = ChatService()