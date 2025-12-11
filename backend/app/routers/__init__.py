from .auth import router as auth_router
from .dependencies import router as dependencies_router
from .requests import router as requests_router
from .stats import router as stats_router
from .public import router as public_router
from .gov_actions import router as gov_actions_router
from .ai import router as ai_router
from .ingestion import router as ingestion_router
from .alerts import router as alerts_router
from .reports import router as reports_router
from .uploads import router as uploads_router
from .routing import router as routing_router
from .chat import router as chat_router
from .users import router as users_router

all_routers = [
    auth_router,
    dependencies_router,
    requests_router,
    stats_router,
    public_router,
    gov_actions_router,
    ai_router, # <-- Asegúrate de que esta línea esté aquí
    ingestion_router,
    alerts_router,
    reports_router,
    uploads_router,
    routing_router,
    chat_router,
    users_router
]