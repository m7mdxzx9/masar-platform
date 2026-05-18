from langchain_openai import ChatOpenAI
from langchain_ollama import ChatOllama
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)


def create_chat_llm(
    temperature: float | None = None,
    max_tokens: int | None = None,
    streaming: bool = True,
):
    temp = temperature if temperature is not None else settings.llm_temperature
    max_tok = max_tokens if max_tokens is not None else settings.llm_max_tokens

    if settings.llm_provider == "nvidia":
        logger.debug("Using NVIDIA LLM provider")
        return ChatOpenAI(
            model=settings.nvidia_model,
            openai_api_key=settings.nvidia_api_key,
            openai_api_base=settings.nvidia_base_url,
            temperature=temp,
            max_tokens=max_tok,
            streaming=streaming,
        )
    elif settings.llm_provider == "ollama":
        logger.debug("Using Ollama LLM provider")
        return ChatOllama(
            model=settings.ollama_model,
            base_url=settings.ollama_base_url,
            temperature=temp,
            num_predict=max_tok,
            streaming=streaming,
        )
    elif settings.llm_provider == "openrouter":
        logger.debug("Using OpenRouter LLM provider")
        return ChatOpenAI(
            model=settings.openrouter_model,
            openai_api_key=settings.openrouter_api_key,
            openai_api_base=settings.openrouter_base_url,
            temperature=temp,
            max_tokens=max_tok,
            streaming=streaming,
            default_headers={
                "HTTP-Referer": "http://localhost:5173",
                "X-Title": "Masar",
            },
        )
    else:
        raise ValueError(f"Unknown LLM provider: {settings.llm_provider}")


def create_vllm_llm(
    temperature: float | None = None,
    max_tokens: int | None = None,
    streaming: bool = True,
):
    temp = temperature if temperature is not None else settings.llm_temperature
    max_tok = max_tokens if max_tokens is not None else settings.llm_max_tokens

    if not settings.vllm_model:
        raise ValueError("VLLM_MODEL must be set to use vLLM provider")

    logger.debug("Using vLLM provider")
    return ChatOpenAI(
        model=settings.vllm_model,
        openai_api_key=settings.vllm_api_key,
        openai_api_base=settings.vllm_base_url,
        temperature=temp,
        max_tokens=max_tok,
        streaming=streaming,
    )
