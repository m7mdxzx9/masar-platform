from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from typing import Optional
import logging
import httpx
import json
from app.core.config import settings

from app.services.agents.agent_service import (
    agent_chat_stream,
    agent_project_ideas,
)
from app.services.agents.prompts import AGENT_PERSONAS
from app.services.agents.agent_runtime import run_react_agent

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/agents", tags=["AI Agents"])


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1)
    agent_type: str = Field(default="general")
    conversation_history: list[dict] = Field(default_factory=list)
    provider: Optional[str] = None
    model: Optional[str] = None


class ProjectIdeasRequest(BaseModel):
    interests: str = Field(..., min_length=1)
    skill_level: str = Field(default="intermediate")
    domain: str = Field(default="general")
    provider: Optional[str] = None
    model: Optional[str] = None


class ReactAgentRequest(BaseModel):
    message: str = Field(..., min_length=1)
    provider: Optional[str] = None
    model: Optional[str] = None


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
                model=request.model,
            ):
                if "\n" in token:
                     lines = token.split("\n")
                     for i, line in enumerate(lines):
                         if i == len(lines) - 1:
                             yield f"data: {line}"
                         else:
                             yield f"data: {line}\n"
                     yield "\n\n"
                else:
                    yield f"data: {token}\n\n"
            yield "data: [DONE]\n\n"
        except Exception as e:
            logger.error(f"Streaming error: {e}", exc_info=True)
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

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
            model=request.model,
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
                model=request.model,
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


class PullModelRequest(BaseModel):
    model_name: str

RECOMMENDED_MODELS = [
    {"id": "gemma2:2b", "name": "Gemma 2 (2B) - نموذج جوجل الحديث للأجهزة المتوسطة", "size": "1.6 GB"},
    {"id": "gemma2:9b", "name": "Gemma 2 (9B) - ذكي للغاية ومناسب للأجهزة المتوسطة", "size": "5.5 GB"},
    {"id": "gemma2:27b", "name": "Gemma 2 (27B) - نموذج جوجل العملاق للمهام الصعبة", "size": "16.0 GB"},
    {"id": "llama3.2:1b", "name": "Llama 3.2 (1B) - خفيف جداً ومناسب للهواتف واللابتوب", "size": "1.3 GB"},
    {"id": "llama3.2:3b", "name": "Llama 3.2 (3B) - نموذج خفيف ذكي ومتكامل", "size": "2.0 GB"},
    {"id": "qwen2.5-coder:1.5b", "name": "Qwen 2.5 Coder (1.5B) - مخصص للبرمجة وكتابة الكود", "size": "1.0 GB"},
]

pulling_status = {}

async def run_pull_model(model_name: str):
    pulling_status[model_name] = "0% (starting)"
    try:
        async with httpx.AsyncClient(timeout=1800.0) as client:
            payload = {"name": model_name, "stream": True}
            async with client.stream("POST", f"{settings.ollama_base_url}/api/pull", json=payload) as response:
                if response.status_code != 200:
                    pulling_status[model_name] = f"failed: Ollama status {response.status_code}"
                    return
                
                async for line in response.aiter_lines():
                    if not line:
                        continue
                    try:
                        data = json.loads(line)
                        status = data.get("status", "")
                        completed = data.get("completed", 0)
                        total = data.get("total", 0)
                        
                        if status == "downloading" and total > 0:
                            percent = (completed / total) * 100
                            pulling_status[model_name] = f"downloading ({percent:.1f}%)"
                        elif status == "success":
                            pulling_status[model_name] = "completed"
                        else:
                            pulling_status[model_name] = status
                    except Exception:
                        pass
        
        # Fallback to completed if successful and not failed
        current = pulling_status.get(model_name, "")
        if current != "completed" and not current.startswith("failed"):
            pulling_status[model_name] = "completed"
    except Exception as e:
        pulling_status[model_name] = f"failed: {str(e)}"

@router.get("/local-models")
async def list_local_models():
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{settings.ollama_base_url}/api/tags", timeout=4.0)
            if response.status_code == 200:
                data = response.json()
                installed = [m["name"] for m in data.get("models", [])]
                return {
                    "status": "online",
                    "installed": installed,
                    "recommended": RECOMMENDED_MODELS
                }
            else:
                return {
                    "status": "offline",
                    "error": f"Ollama status code: {response.status_code}",
                    "installed": [],
                    "recommended": RECOMMENDED_MODELS
                }
    except Exception as e:
        return {
            "status": "offline",
            "error": str(e),
            "installed": [],
            "recommended": RECOMMENDED_MODELS
        }

@router.post("/pull-model")
async def pull_model(req: PullModelRequest, background_tasks: BackgroundTasks):
    try:
        async with httpx.AsyncClient() as client:
            res = await client.get(f"{settings.ollama_base_url}/api/tags", timeout=2.0)
            if res.status_code != 200:
                raise HTTPException(status_code=503, detail="Ollama server is offline")
    except Exception:
         raise HTTPException(status_code=503, detail="Ollama server is offline or unreachable")

    background_tasks.add_task(run_pull_model, req.model_name)
    return {"message": "Started pulling model in the background", "model_name": req.model_name}

@router.get("/pull-status/{model_name}")
async def get_pull_status(model_name: str):
    status = pulling_status.get(model_name, "idle")
    return {"model_name": model_name, "status": status}


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


from app.core.database import async_session_factory
from sqlalchemy import select

class ChatHistorySaveRequest(BaseModel):
    role: str
    content: str
    displayContent: Optional[str] = None


@router.get("/history/{agent_id}")
async def get_chat_history(agent_id: str):
    async with async_session_factory() as session:
        from app.models.models import AIChatMessage
        stmt = (
            select(AIChatMessage)
            .where(AIChatMessage.agent_id == agent_id)
            .order_by(AIChatMessage.created_at.asc())
        )
        result = await session.execute(stmt)
        messages = result.scalars().all()
        return {
            "messages": [
                {
                    "role": msg.role,
                    "content": msg.content,
                    "displayContent": msg.display_content,
                    "timestamp": msg.created_at.isoformat() if msg.created_at else None,
                }
                for msg in messages
            ]
        }


@router.post("/history/{agent_id}")
async def save_chat_message(agent_id: str, req: ChatHistorySaveRequest):
    async with async_session_factory() as session:
        from app.models.models import AIChatMessage
        msg = AIChatMessage(
            agent_id=agent_id,
            role=req.role,
            content=req.content,
            display_content=req.displayContent,
        )
        session.add(msg)
        await session.commit()
        return {"success": True}


@router.delete("/history/{agent_id}")
async def clear_chat_history(agent_id: str):
    async with async_session_factory() as session:
        from app.models.models import AIChatMessage
        stmt = select(AIChatMessage).where(AIChatMessage.agent_id == agent_id)
        result = await session.execute(stmt)
        messages = result.scalars().all()
        for msg in messages:
            await session.delete(msg)
        await session.commit()
        return {"success": True}


class SessionCreateRequest(BaseModel):
    agent_id: str = "general"
    title: Optional[str] = "محادثة جديدة"


class SessionMessageSaveRequest(BaseModel):
    role: str
    content: str
    displayContent: Optional[str] = None


@router.get("/sessions")
async def list_chat_sessions(agent_id: str = "general"):
    async with async_session_factory() as session:
        from app.models.models import ChatSession
        stmt = (
            select(ChatSession)
            .where(ChatSession.agent_id == agent_id)
            .order_by(ChatSession.updated_at.desc())
        )
        result = await session.execute(stmt)
        sessions = result.scalars().all()
        return {
            "sessions": [
                {
                    "id": s.id,
                    "agent_id": s.agent_id,
                    "title": s.title,
                    "created_at": s.created_at.isoformat() if s.created_at else None,
                    "updated_at": s.updated_at.isoformat() if s.updated_at else None,
                }
                for s in sessions
            ]
        }


@router.post("/sessions")
async def create_chat_session(req: SessionCreateRequest):
    async with async_session_factory() as session:
        from app.models.models import ChatSession
        new_session = ChatSession(
            agent_id=req.agent_id,
            title=req.title or "محادثة جديدة"
        )
        session.add(new_session)
        await session.commit()
        await session.refresh(new_session)
        return {
            "id": new_session.id,
            "agent_id": new_session.agent_id,
            "title": new_session.title,
            "created_at": new_session.created_at.isoformat() if new_session.created_at else None,
        }


@router.delete("/sessions/{session_id}")
async def delete_chat_session(session_id: int):
    async with async_session_factory() as session:
        from app.models.models import ChatSession
        stmt = select(ChatSession).where(ChatSession.id == session_id)
        result = await session.execute(stmt)
        chat_sess = result.scalars().first()
        if not chat_sess:
            raise HTTPException(status_code=404, detail="Session not found")
        await session.delete(chat_sess)
        await session.commit()
        return {"success": True}


@router.get("/sessions/{session_id}/messages")
async def get_session_messages(session_id: int):
    async with async_session_factory() as session:
        from app.models.models import ChatMessage
        stmt = (
            select(ChatMessage)
            .where(ChatMessage.session_id == session_id)
            .order_by(ChatMessage.created_at.asc())
        )
        result = await session.execute(stmt)
        messages = result.scalars().all()
        return {
            "messages": [
                {
                    "role": msg.role,
                    "content": msg.content,
                    "displayContent": msg.display_content,
                    "timestamp": msg.created_at.isoformat() if msg.created_at else None,
                }
                for msg in messages
            ]
        }


@router.post("/sessions/{session_id}/messages")
async def save_session_message(session_id: int, req: SessionMessageSaveRequest):
    async with async_session_factory() as session:
        from app.models.models import ChatSession, ChatMessage
        # Verify session exists
        stmt_sess = select(ChatSession).where(ChatSession.id == session_id)
        result_sess = await session.execute(stmt_sess)
        chat_sess = result_sess.scalars().first()
        if not chat_sess:
            raise HTTPException(status_code=404, detail="Session not found")

        # Save message
        new_msg = ChatMessage(
            session_id=session_id,
            role=req.role,
            content=req.content,
            display_content=req.displayContent,
        )
        session.add(new_msg)
        
        # Update session title if default and this is first user message
        if chat_sess.title == "محادثة جديدة" and req.role == "user":
            chat_sess.title = req.content[:30] + ("..." if len(req.content) > 30 else "")
            
        import datetime
        chat_sess.updated_at = datetime.datetime.now(datetime.timezone.utc)
        
        await session.commit()
        return {"success": True}

