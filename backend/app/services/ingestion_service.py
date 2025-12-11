import io
import logging
from pypdf import PdfReader
from sqlalchemy.orm import Session
from app.models.knowledge import KnowledgeItem
from app.services.embedding_service import embedding_service

logger = logging.getLogger(__name__)

class IngestionService:
    def process_pdf(self, db: Session, file_content: bytes, filename: str, tenant_id: str):
        """
        Lee un PDF, extrae texto, lo vectoriza con Google API y lo guarda en Postgres.
        """
        try:
            logger.info(f"📄 Procesando PDF: {filename}")
            reader = PdfReader(io.BytesIO(file_content))
            full_text = ""
            for page in reader.pages:
                text = page.extract_text()
                if text:
                    full_text += text + "\n"
            
            # Chunking: Dividir en fragmentos de ~1000 caracteres
            chunk_size = 1000
            overlap = 100
            chunks = []
            
            for i in range(0, len(full_text), chunk_size - overlap):
                chunk = full_text[i:i + chunk_size]
                if len(chunk.strip()) > 50:
                    chunks.append(chunk)
            
            logger.info(f"🧩 Generados {len(chunks)} fragmentos. Iniciando vectorización con Google...")
            
            count = 0
            for chunk in chunks:
                # 1. Generar Vector (API Call)
                vector = embedding_service.get_embedding(chunk, task_type="retrieval_document")
                
                if vector:
                    # 2. Guardar en BD
                    item = KnowledgeItem(
                        tenant_id=tenant_id,
                        topic=f"Manual: {filename}",
                        content=chunk,
                        source_filename=filename,
                        embedding=vector
                    )
                    db.add(item)
                    count += 1
            
            db.commit()
            logger.info(f"✅ Ingesta completada: {count} items guardados.")
            return {"status": "success", "chunks_created": count, "filename": filename}
            
        except Exception as e:
            logger.error(f"❌ Error ingesting PDF: {e}")
            db.rollback()
            return {"status": "error", "msg": str(e)}

ingestion_service = IngestionService()