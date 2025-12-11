import json
import logging
import asyncio
import math
from typing import List, Dict, Any
from openai import AsyncOpenAI
from sqlalchemy.orm import Session
from app.core.config import settings
from app.models.requests import CitizenRequest, Topic, Urgency, Sentiment, RequestType, AnalysisStatus
from app.models.organization import Department
from app.database import SessionLocal

logger = logging.getLogger(__name__)

class AIService:
    def __init__(self):
        if settings.DEEPSEEK_API_KEY:
            self.client = AsyncOpenAI(
                api_key=settings.DEEPSEEK_API_KEY,
                base_url=settings.DEEPSEEK_BASE_URL
            )
            self.model = settings.DEEPSEEK_MODEL
        else:
            self.client = None

    def _get_system_prompt(self):
        return """
        Eres un Coordinador de Despacho del Gobierno de Yucatán.
        Tu trabajo es leer solicitudes y decidir QUIÉN las atiende y QUÉ deben hacer.

        TU MISIÓN:
        1. Clasificar TIPO: ADMINISTRATIVA (Papeles/Info) vs OPERATIVA (Acción en calle).
        2. Asignar DEPENDENCIA: ¿Quién resuelve esto? (SSP, Salud, JAPAY, Ayuntamiento, Transparencia).
        3. Dictar ACCIÓN SUGERIDA: ¿Cuál es el siguiente paso lógico?
        4. Determinar URGENCIA y SENTIMIENTO.

        REGLAS DE NEGOCIO:
        - Si piden estadísticas, contratos o leyes -> Depto: "Transparencia" | Tipo: ADMINISTRATIVA.
        - Si reportan un delito o riesgo -> Depto: "SSP" | Tipo: OPERATIVA.
        - Si es bache/luz -> Depto: "Servicios Públicos" | Tipo: OPERATIVA.

        SALIDA JSON OBLIGATORIA (Lista de objetos):
        [
          {
            "folio": "...", 
            "tipo": "ADMINISTRATIVA" | "OPERATIVA", 
            "topic": "Seguridad" | "Salud" | "Transporte" | "Servicios Públicos" | "Educación" | "Transparencia" | "Otros", 
            "urgency": "Baja" | "Media" | "Alta" | "Crítica", 
            "sentiment": "Positivo" | "Neutro" | "Negativo",
            "department": "Nombre de la dependencia",
            "suggested_action": "Acción concreta a realizar"
          }
        ]
        """

    async def classify_request(self, text: str) -> Dict[str, Any]:
        if not self.client:
            return {"topic": Topic.otros, "sentiment": Sentiment.neutro, "urgency": Urgency.media}
        try:
            payload = [{"folio": "SINGLE", "texto": text[:500]}]
            user_prompt = json.dumps(payload, ensure_ascii=False)
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "system", "content": self._get_system_prompt()}, {"role": "user", "content": user_prompt}],
                temperature=0.1,
                response_format={ "type": "json_object" }
            )
            content = response.choices[0].message.content
            if "```json" in content: content = content.replace("```json", "").replace("```", "")
            result_json = json.loads(content)
            item = result_json[0] if isinstance(result_json, list) and result_json else {}
            if isinstance(result_json, dict):
                for val in result_json.values():
                    if isinstance(val, list) and val: item = val[0]; break
            
            return {
                "topic": item.get("topic", "Otros"),
                "urgency": item.get("urgency", "Media"),
                "sentiment": item.get("sentiment", "Neutro"),
                "request_type": item.get("tipo", "DESCONOCIDA"),
                "suggested_action": item.get("suggested_action", "")
            }
        except Exception as e:
            logger.error(f"Error single classify: {e}")
            return {"topic": "Otros", "sentiment": "Neutro", "urgency": "Media"}

    async def _process_batch(self, db: Session, batch: List[CitizenRequest]):
        if not self.client: return

        items_to_send = []
        req_map = {}
        for req in batch:
            clean_desc = str(req.description).replace('\n', ' ').strip()[:600]
            items_to_send.append({"folio": req.folio, "texto": clean_desc})
            req_map[req.folio] = req
            req.analysis_status = AnalysisStatus.procesando
        
        db.commit()

        try:
            user_prompt = json.dumps(items_to_send, ensure_ascii=False)
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "system", "content": self._get_system_prompt()}, {"role": "user", "content": user_prompt}],
                temperature=0.1,
                response_format={ "type": "json_object" }
            )
            
            content = response.choices[0].message.content
            if "```json" in content: content = content.replace("```json", "").replace("```", "")
            result_json = json.loads(content)
            
            results = []
            if isinstance(result_json, dict):
                for key, val in result_json.items():
                    if isinstance(val, list): results = val; break
                if not results: results = [result_json]
            elif isinstance(result_json, list):
                results = result_json

            for item in results:
                folio = item.get("folio")
                req = req_map.get(folio)
                if req:
                    # --- MAPEO ROBUSTO (CASE INSENSITIVE) ---
                    def map_enum(enum_cls, value, default):
                        try:
                            # Intento directo
                            return enum_cls(value)
                        except ValueError:
                            # Intento case-insensitive
                            for member in enum_cls:
                                if member.value.upper() == str(value).upper():
                                    return member
                            return default

                    req.topic = map_enum(Topic, item.get("topic"), Topic.otros)
                    req.urgency = map_enum(Urgency, item.get("urgency"), Urgency.media)
                    req.sentiment = map_enum(Sentiment, item.get("sentiment"), Sentiment.neutro)
                    req.request_type = map_enum(RequestType, item.get("tipo"), RequestType.desconocida)
                    
                    req.suggested_action = item.get("suggested_action", "Revisar caso")
                    dept_name = item.get("department")
                    if dept_name: req.internal_notes = f"[IA Sugiere Dept]: {dept_name}"

                    req.analysis_status = AnalysisStatus.completado

        except Exception as e:
            logger.error(f"Error IA Batch: {e}")
            for req in batch:
                if req.analysis_status == AnalysisStatus.procesando:
                    req.analysis_status = AnalysisStatus.error
                    req.internal_notes = f"Error IA: {str(e)}"

        db.commit()

    async def process_queue(self):
        logger.info("🚀 Iniciando Worker de IA...")
        db = SessionLocal()
        BATCH_SIZE = 5
        try:
            while True:
                pending = db.query(CitizenRequest).filter(
                    CitizenRequest.analysis_status == AnalysisStatus.pendiente
                ).limit(BATCH_SIZE).all()
                if not pending: break
                logger.info(f"⚡ Procesando lote de {len(pending)} solicitudes...")
                await self._process_batch(db, pending)
                await asyncio.sleep(1)
        except Exception as e:
            logger.error(f"🔥 Error fatal en Worker IA: {e}")
        finally:
            db.close()
            logger.info("🏁 Worker IA finalizado.")

    def run_process_queue(self):
        asyncio.run(self.process_queue())

ai_service = AIService()