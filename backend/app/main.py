
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from app.core.config import settings
from app.core.database import init_db
from app.api import agents, courses, labs, games, knowledge, calendar, schedule, progress, projects, subjects, notes, study_assistant, flashcards

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
    yield
    logger.info("Shutting down...")


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Masar (مسار) — Agentic AI Learning Platform with RAG",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api_prefix = "/api/v1"

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
