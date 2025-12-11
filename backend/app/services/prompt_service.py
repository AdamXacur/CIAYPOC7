import os
from jinja2 import Environment, FileSystemLoader, select_autoescape
from typing import List, Dict, Any
import logging
from sqlalchemy.orm import Session
from app.models.knowledge import KnowledgeItem
from app.services.embedding_service import embedding_service

logger = logging.getLogger(__name__)

class PromptService:
    def __init__(self):
        current_dir = os.path.dirname(os.path.abspath(__file__))
        prompts_dir = os.path.join(current_dir, "../prompts")
        
        self.env = Environment(
            loader=FileSystemLoader(prompts_dir),
            autoescape=select_autoescape(['html', 'xml', 'j2'])
        )

    def get_rag_context(self, db: Session, query_text: str, limit: int = 3) -> str:
        """
        Busca en la base de datos vectorial los fragmentos de manuales más relevantes
        para el lote de quejas actual.
        """
        try:
            # 1. Vectorizar el resumen del problema (ej. "Falla de red en Kanasín")
            query_vector = embedding_service.get_embedding(query_text, task_type="retrieval_query")
            
            if not query_vector:
                return "No se pudo acceder al servicio de embeddings."

            # 2. Búsqueda Semántica en Postgres
            results = db.query(KnowledgeItem).order_by(
                KnowledgeItem.embedding.cosine_distance(query_vector)
            ).limit(limit).all()

            if not results:
                return "No hay manuales relevantes para este caso."

            # 3. Formatear contexto para el Prompt
            context_str = "FRAGMENTOS RELEVANTES DE LOS MANUALES OPERATIVOS:\n"
            for item in results:
                context_str += f"- [{item.topic}]: {item.content}\n"
            
            return context_str

        except Exception as e:
            logger.error(f"Error recuperando contexto RAG: {e}")
            return "Error recuperando contexto."

    def render_batch_analysis(self, db: Session, requests: List[Dict[str, Any]]) -> str:
        """
        Renderiza el prompt batch, inyectando contexto dinámico basado en los datos.
        """
        try:
            # 1. Crear un "mini resumen" de los datos para buscar en la BD vectorial
            # Concatenamos las descripciones para buscar reglas relacionadas
            search_query = " ".join([r['description'] for r in requests[:5]]) # Usamos los primeros 5 como muestra
            
            # 2. Obtener Contexto Real
            rag_context = self.get_rag_context(db, search_query)
            
            # 3. Renderizar Template
            template = self.env.get_template("analysis/batch_root_cause.j2")
            return template.render(requests=requests, rag_context=rag_context)
            
        except Exception as e:
            logger.error(f"❌ Error renderizando prompt batch: {e}")
            return ""

    def render_triage(self, request_data: Dict[str, Any], rag_context: str = "") -> str:
        try:
            template = self.env.get_template("analysis/triage_level1.j2")
            return template.render(request=request_data, rag_context=rag_context)
        except Exception as e:
            logger.error(f"❌ Error renderizando prompt triage: {e}")
            return ""

prompt_service = PromptService()