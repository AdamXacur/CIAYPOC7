import sys
import os
# Añadir el directorio raíz al path para poder importar 'app'
sys.path.append(os.getcwd())

from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.knowledge import KnowledgeItem
from app.services.embedding_service import embedding_service

# DATOS SINTÉTICOS (Simulando lo que Verónica generaría con NotebookLM)
# Estas son las "Reglas del Juego" que la IA debe aprender.
MANUAL_ENTRIES = [
    {
        "topic": "Matriz de Escalación - Redes",
        "content": "REGLA DE REDES: Si la falla de internet se reporta en un solo equipo, es responsabilidad del Soporte Local (Nivel 1). Si la falla afecta a todo un edificio o secretaría (más de 3 reportes simultáneos), es responsabilidad de la Dirección de Infraestructura Tecnológica (Nivel 2). En Kanasín, el proveedor es exclusivo de 'Telecom del Mayab', reportar directo a proveedor."
    },
    {
        "topic": "Matriz de Escalación - Software",
        "content": "REGLA DE SISTEMAS: Errores de 'Usuario o Contraseña inválida' son siempre Nivel 1 (Gestión de Identidad Local). Errores 500 o 'Servidor no disponible' en el portal de Finanzas deben escalarse inmediatamente a la Dirección de Desarrollo (Nivel 2) y marcarse como Críticos."
    },
    {
        "topic": "Política de Hardware",
        "content": "REGLA DE IMPRESORAS: El gobierno no repara impresoras. Son servicio arrendado. Si una impresora falla, no se manda técnico, se solicita reemplazo al proveedor externo 'PrintYuc'. No escalar a Nivel 2."
    },
    {
        "topic": "Protocolo de Crisis",
        "content": "ALERTA SOCIAL: Si se detectan múltiples quejas sobre 'Falta de servicio' en hospitales (Salud) o seguridad pública, se debe generar una Alerta de Sistema tipo CRÍTICA y notificar al Despacho del Gobernador, independientemente de la causa técnica."
    }
]

def seed_knowledge():
    print("🧠 Iniciando carga de Conocimiento Institucional (Simulación RAG)...")
    db: Session = SessionLocal()
    
    try:
        count = 0
        for entry in MANUAL_ENTRIES:
            print(f"   procesando: {entry['topic']}...")
            
            # 1. Generar Vector (Embedding)
            # Esto convierte el texto en números para que la IA pueda buscarlo por similitud
            vector = embedding_service.get_embedding(entry["content"], task_type="retrieval_document")
            
            if vector:
                # 2. Guardar en Postgres
                item = KnowledgeItem(
                    tenant_id="gobierno_central",
                    topic=entry["topic"],
                    content=entry["content"],
                    source_filename="manual_operaciones_2024_sintetico.pdf",
                    embedding=vector
                )
                db.add(item)
                count += 1
            else:
                print(f"   ⚠️ Error generando embedding para {entry['topic']}")

        db.commit()
        print(f"✅ Éxito: Se inyectaron {count} reglas de negocio en la memoria de la IA.")
        print("   Ahora la IA sabrá distinguir entre un problema local y uno central.")

    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_knowledge()