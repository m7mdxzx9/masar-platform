from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from typing import Optional
import logging

from app.services.agents.agent_service import (
    agent_chat_stream,
    agent_project_ideas,
    AGENT_PERSONAS,
)
from app.services.agents.agent_runtime import run_react_agent

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/agents", tags=["AI Agents"])


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1)
    agent_type: str = Field(default="general")
    conversation_history: list[dict] = Field(default_factory=list)
    provider: Optional[str] = "google"


class ProjectIdeasRequest(BaseModel):
    interests: str = Field(..., min_length=1)
    skill_level: str = Field(default="intermediate")
    domain: str = Field(default="general")
    provider: Optional[str] = "google"


class ReactAgentRequest(BaseModel):
    message: str = Field(..., min_length=1)
    provider: Optional[str] = "google"


@router.get("/")
def list_agents():
    agents = []
    for agent_id, prompt in AGENT_PERSONAS.items():
        agents.append(
            {
                "id": agent_id,
                "name": agent_id.replace("_", " ").title(),
                "description": prompt[:150] + "...",
            }
        )
    return {"agents": agents}


@router.post("/chat")
async def chat(request: ChatRequest):
    if request.agent_type not in AGENT_PERSONAS:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown agent type: {request.agent_type}. Available: {list(AGENT_PERSONAS.keys())}",
        )

    async def stream_generator():
        try:
            async for token in agent_chat_stream(
                message=request.message,
                agent_type=request.agent_type,
                conversation_history=request.conversation_history,
                provider=request.provider,
            ):
                yield f"data: {token}\n\n"
            yield "data: [DONE]\n\n"
        except Exception as e:
            logger.error(f"Streaming error: {e}")
            yield f"data: {{'error': '{str(e)}'}}\n\n"

    return StreamingResponse(
        stream_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.post("/project-ideas")
async def project_ideas(request: ProjectIdeasRequest):
    try:
        result = await agent_project_ideas(
            interests=request.interests,
            skill_level=request.skill_level,
            domain=request.domain,
            provider=request.provider,
        )
        return result
    except Exception as e:
        logger.error(f"Project ideas error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/react-run")
async def react_run(request: ReactAgentRequest):
    async def stream_generator():
        try:
            async for token in run_react_agent(
                message=request.message,
                provider=request.provider,
            ):
                yield token
        except Exception as e:
            logger.error(f"ReAct agent streaming error: {e}")
            yield f"data: [AGENT_ERROR] {str(e)}\n\n"

    return StreamingResponse(
        stream_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.get("/config")
def get_agent_config():
    from app.core.config import settings

    return {
        "llm_provider": settings.llm_provider,
        "llm_model": settings.effective_llm_model,
        "embedding_provider": settings.embedding_provider,
        "embedding_model": settings.effective_embedding_model,
        "vector_store": settings.vector_store_backend,
        "streaming": True,
    }
