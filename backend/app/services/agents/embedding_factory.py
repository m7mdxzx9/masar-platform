from langchain_openai import OpenAIEmbeddings
from langchain_ollama import OllamaEmbeddings
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

_embedding_model = None


def create_embedding_model():
    global _embedding_model
    if _embedding_model is not None:
        return _embedding_model
    if settings.embedding_provider == "nvidia":
        logger.debug("Using NVIDIA embedding provider")
        _embedding_model = OpenAIEmbeddings(
            model=settings.nvidia_embedding_model,
            openai_api_key=settings.nvidia_api_key,
            openai_api_base=settings.nvidia_base_url,
        )
    elif settings.embedding_provider == "ollama":
        logger.debug("Using Ollama embedding provider")
        _embedding_model = OllamaEmbeddings(
            model=settings.ollama_embedding_model,
            base_url=settings.ollama_base_url,
        )
    else:
        raise ValueError(f"Unknown embedding provider: {settings.embedding_provider}")
    return _embedding_model


async def embed_text(content: str) -> list[float]:
    model = create_embedding_model()
    result = await model.aembed_query(content)
    return result


async def embed_documents(chunks: list[str]) -> list[list[float]]:
    model = create_embedding_model()
    result = await model.aembed_documents(chunks)
    return result
