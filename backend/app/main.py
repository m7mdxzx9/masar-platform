
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from app.core.config import settings
from app.core.database import init_db
from app.core.cache import cache
from app.core.exceptions import MasarException, masar_exception_handler, global_exception_handler
from app.api import auth, agents, courses, labs, games, knowledge, calendar, schedule, progress, projects, subjects, notes, study_assistant, flashcards, snippets, focus as focus_api, goals as goals_api, git as git_api, backup as backup_api, translate as translate_api, gdrive as gdrive_api, analytics as analytics_api, tutor as tutor_api, labs_enhanced as labs_enhanced_api, sync as sync_api, vocabulary as vocabulary_api, english as english_api, voice_tutor as voice_tutor_api


logging.basicConfig(
    level=logging.DEBUG if settings.debug else logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Starting {settings.app_name} v{settings.app_version}")
    logger.info(f"LLM Provider: {settings.llm_provider} | Model: {settings.effective_llm_model}")
    logger.info(f"Embedding: {settings.embedding_provider} | Model: {settings.effective_embedding_model}")
    logger.info(f"Vector Store: {settings.vector_store_backend}")
    await init_db()
    logger.info("Database initialized")
    await cache.init()
    yield
    logger.info("Shutting down...")
    await cache.close()


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Masar (مسار) — Agentic AI Learning Platform with RAG",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/api/v1/openapi.json",
    contact={
        "name": "Masar Support",
        "email": "support@masar.local",
    },
    license_info={
        "name": "Proprietary",
    },
    lifespan=lifespan,
)

# Exception Handlers
app.add_exception_handler(MasarException, masar_exception_handler)
app.add_exception_handler(Exception, global_exception_handler)

@app.middleware("http")
async def rewrite_api_prefix(request, call_next):
    path = request.scope.get("path", "")
    if path.startswith("/api/") and not path.startswith("/api/v1/"):
        new_path = path.replace("/api/", "/api/v1/", 1)
        request.scope["path"] = new_path
        raw_path = request.scope.get("raw_path", b"")
        if raw_path.startswith(b"/api/") and not raw_path.startswith(b"/api/v1/"):
            request.scope["raw_path"] = raw_path.replace(b"/api/", b"/api/v1/", 1)
    return await call_next(request)


# CORS Setup (Added last to run first in the middleware execution stack)
CORS_ORIGINS_LIST = [
    "https://masar-frontend-nsdo.onrender.com",
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
]
for o in settings.allowed_origins:
    if o.strip() and o.strip() != "*" and o not in CORS_ORIGINS_LIST:
        CORS_ORIGINS_LIST.append(o)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS_LIST,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Length"],
)


api_prefix = "/api/v1"

app.include_router(auth.router, prefix=api_prefix)
app.include_router(calendar.router, prefix=api_prefix)
app.include_router(schedule.router, prefix=api_prefix)
app.include_router(agents.router, prefix=api_prefix)
app.include_router(knowledge.router, prefix=api_prefix)
app.include_router(courses.router, prefix=api_prefix)
app.include_router(labs.router, prefix=api_prefix)
app.include_router(games.router, prefix=api_prefix)
app.include_router(progress.router, prefix=api_prefix)
app.include_router(projects.router, prefix=api_prefix)
app.include_router(subjects.router, prefix=api_prefix)
app.include_router(notes.router, prefix=api_prefix)
app.include_router(study_assistant.router, prefix=api_prefix)
app.include_router(flashcards.router, prefix=api_prefix)
app.include_router(snippets.router, prefix=api_prefix)
app.include_router(focus_api.router, prefix=api_prefix)
app.include_router(goals_api.router, prefix=api_prefix)
app.include_router(git_api.router, prefix=api_prefix)
app.include_router(backup_api.router, prefix=api_prefix)
app.include_router(translate_api.router, prefix=api_prefix)
app.include_router(gdrive_api.router, prefix=api_prefix)
app.include_router(analytics_api.router, prefix=api_prefix)
app.include_router(tutor_api.router, prefix=api_prefix)
app.include_router(labs_enhanced_api.router, prefix=api_prefix)
app.include_router(sync_api.router, prefix=api_prefix)
app.include_router(vocabulary_api.router, prefix=api_prefix)
app.include_router(english_api.router, prefix=api_prefix)
app.include_router(voice_tutor_api.router, prefix=api_prefix)




@app.get("/")
def root():
    return {
        "name": "Masar Platform",
        "version": settings.app_version,
        "status": "operational",
        "llm_provider": settings.llm_provider,
        "vector_store": settings.vector_store_backend,
        "docs": "/docs",
    }


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "llm_provider": settings.llm_provider,
        "llm_model": settings.effective_llm_model,
        "embedding_provider": settings.embedding_provider,
        "vector_store_backend": settings.vector_store_backend,
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.environment == "development",
    )
