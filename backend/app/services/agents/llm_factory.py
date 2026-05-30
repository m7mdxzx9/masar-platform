import base64
import logging
from typing import Any, AsyncIterator, Dict, Iterator, List, Optional

from google import genai
from google.genai import types
from langchain_core.callbacks import (
    AsyncCallbackManagerForLLMRun,
    CallbackManagerForLLMRun,
)
from langchain_core.language_models.chat_models import BaseChatModel
from langchain_core.messages import (
    AIMessage,
    BaseMessage,
    ChatMessage,
    HumanMessage,
    SystemMessage,
    AIMessageChunk,
)
from langchain_core.outputs import ChatGeneration, ChatResult, ChatGenerationChunk
from langchain_openai import ChatOpenAI
from langchain_ollama import ChatOllama
from app.core.config import settings

logger = logging.getLogger(__name__)


class GeminiDirectChat(BaseChatModel):
    model_name: str = "gemini-2.5-flash"
    temperature: float = 0.4
    max_tokens: Optional[int] = None
    json_mode: bool = False

    def _convert_messages(self, messages: List[BaseMessage]) -> tuple[Optional[str], List[types.Content]]:
        contents = []
        system_instruction = None
        
        for msg in messages:
            role = ""
            content = ""
            if isinstance(msg, dict):
                role = msg.get("role", "")
                content = msg.get("content", "")
            else:
                content = msg.content
                if isinstance(msg, SystemMessage):
                    role = "system"
                elif isinstance(msg, HumanMessage):
                    role = "user"
                elif isinstance(msg, AIMessage):
                    role = "model"
                else:
                    role = "user"

            if role == "system":
                system_instruction = content
            elif role == "user":
                parts = []
                if isinstance(content, str):
                    parts.append(types.Part.from_text(text=content))
                elif isinstance(content, list):
                    for part in content:
                        if isinstance(part, str):
                            parts.append(types.Part.from_text(text=part))
                        elif isinstance(part, dict):
                            if part.get("type") == "text":
                                parts.append(types.Part.from_text(text=part.get("text")))
                            elif part.get("type") == "image_url":
                                img_url = part["image_url"]["url"]
                                if img_url.startswith("data:"):
                                    header, base64_data = img_url.split(";base64,")
                                    mime_type = header.replace("data:", "")
                                    bytes_data = base64.b64decode(base64_data)
                                    parts.append(types.Part.from_bytes(data=bytes_data, mime_type=mime_type))
                                else:
                                    parts.append(types.Part.from_text(text=img_url))
                contents.append(types.Content(role="user", parts=parts))
            elif role in ("model", "assistant"):
                parts = []
                if isinstance(content, str):
                    parts.append(types.Part.from_text(text=content))
                elif isinstance(content, list):
                    for part in content:
                        if isinstance(part, str):
                            parts.append(types.Part.from_text(text=part))
                        elif isinstance(part, dict):
                            if part.get("type") == "text":
                                parts.append(types.Part.from_text(text=part.get("text")))
                contents.append(types.Content(role="model", parts=parts))
        return system_instruction, contents

    def _generate(
        self,
        messages: List[BaseMessage],
        stop: Optional[List[str]] = None,
        run_manager: Optional[CallbackManagerForLLMRun] = None,
        **kwargs: Any,
    ) -> ChatResult:
        client = genai.Client(api_key=settings.google_api_key)
        system_instruction, contents = self._convert_messages(messages)

        config = types.GenerateContentConfig(
            system_instruction=system_instruction,
            temperature=self.temperature,
            max_output_tokens=self.max_tokens,
            response_mime_type="application/json" if self.json_mode else None,
        )
        
        response = client.models.generate_content(
            model=self.model_name,
            contents=contents,
            config=config,
        )
        
        ai_message = AIMessage(content=response.text or "")
        return ChatResult(generations=[ChatGeneration(message=ai_message)])

    async def _agenerate(
        self,
        messages: List[BaseMessage],
        stop: Optional[List[str]] = None,
        run_manager: Optional[AsyncCallbackManagerForLLMRun] = None,
        **kwargs: Any,
    ) -> ChatResult:
        client = genai.Client(api_key=settings.google_api_key)
        system_instruction, contents = self._convert_messages(messages)

        config = types.GenerateContentConfig(
            system_instruction=system_instruction,
            temperature=self.temperature,
            max_output_tokens=self.max_tokens,
            response_mime_type="application/json" if self.json_mode else None,
        )
        
        response = await client.aio.models.generate_content(
            model=self.model_name,
            contents=contents,
            config=config,
        )
        
        ai_message = AIMessage(content=response.text or "")
        return ChatResult(generations=[ChatGeneration(message=ai_message)])

    async def _astream(
        self,
        messages: List[BaseMessage],
        stop: Optional[List[str]] = None,
        run_manager: Optional[AsyncCallbackManagerForLLMRun] = None,
        **kwargs: Any,
    ) -> AsyncIterator[ChatGenerationChunk]:
        client = genai.Client(api_key=settings.google_api_key)
        system_instruction, contents = self._convert_messages(messages)

        config = types.GenerateContentConfig(
            system_instruction=system_instruction,
            temperature=self.temperature,
            max_output_tokens=self.max_tokens,
            response_mime_type="application/json" if self.json_mode else None,
        )
        
        response_stream = await client.aio.models.generate_content_stream(
            model=self.model_name,
            contents=contents,
            config=config,
        )
        async for chunk in response_stream:
            text = chunk.text or ""
            yield ChatGenerationChunk(message=AIMessageChunk(content=text))

    @property
    def _llm_type(self) -> str:
        return "google-genai"


def create_chat_llm(
    temperature: float | None = None,
    max_tokens: int | None = None,
    streaming: bool = True,
    model: str | None = None,
    json_mode: bool = False,
    provider: str | None = None,
):
    temp = temperature if temperature is not None else settings.llm_temperature
    max_tok = max_tokens if max_tokens is not None else settings.llm_max_tokens

    active_provider = provider or settings.llm_provider

    if active_provider == "google":
        logger.debug("Using direct Google GenAI provider")
        return GeminiDirectChat(
            model_name=model or "gemini-2.5-flash",
            temperature=temp,
            max_tokens=max_tok,
            json_mode=json_mode,
        )

    model_kwargs = {}
    if json_mode:
        model_kwargs["response_format"] = {"type": "json_object"}

    if active_provider == "nvidia":
        logger.debug("Using NVIDIA LLM provider")
        return ChatOpenAI(
            model=model or settings.nvidia_model,
            openai_api_key=settings.nvidia_api_key,
            openai_api_base=settings.nvidia_base_url,
            temperature=temp,
            max_tokens=max_tok,
            streaming=streaming,
            model_kwargs=model_kwargs,
        )
    elif active_provider == "ollama":
        logger.debug("Using Ollama LLM provider")
        return ChatOllama(
            model=model or settings.ollama_model,
            base_url=settings.ollama_base_url,
            temperature=temp,
            num_predict=max_tok,
            streaming=streaming,
            format="json" if json_mode else None,
        )
    elif active_provider == "openrouter":
        logger.debug("Using OpenRouter LLM provider")
        return ChatOpenAI(
            model=model or settings.openrouter_model,
            openai_api_key=settings.openrouter_api_key,
            openai_api_base=settings.openrouter_base_url,
            temperature=temp,
            max_tokens=max_tok,
            streaming=streaming,
            model_kwargs=model_kwargs,
            default_headers={
                "HTTP-Referer": "http://localhost:5173",
                "X-Title": "Masar",
            },
        )
    else:
        raise ValueError(f"Unknown LLM provider: {active_provider}")


def create_chat_llm_with_fallback(
    temperature: float | None = None,
    max_tokens: int | None = None,
    streaming: bool = True,
    json_mode: bool = False,
    provider: str | None = None,
):
    active_provider = provider or settings.llm_provider
    if active_provider == "openrouter" and settings.openrouter_fallback_model:
        primary = create_chat_llm(
            temperature=temperature,
            max_tokens=max_tokens,
            streaming=streaming,
            model=settings.openrouter_model,
            json_mode=json_mode,
            provider=active_provider,
        )
        fallback = create_chat_llm(
            temperature=temperature,
            max_tokens=max_tokens,
            streaming=streaming,
            model=settings.openrouter_fallback_model,
            json_mode=json_mode,
            provider=active_provider,
        )
        logger.info(
            f"Using OpenRouter with fallback: primary={settings.openrouter_model}, "
            f"fallback={settings.openrouter_fallback_model}"
        )
        return primary.with_fallbacks([fallback])
    return create_chat_llm(
        temperature=temperature,
        max_tokens=max_tokens,
        streaming=streaming,
        json_mode=json_mode,
        provider=active_provider,
    )


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
