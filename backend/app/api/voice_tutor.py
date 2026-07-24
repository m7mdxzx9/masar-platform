import logging
from typing import Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, WebSocket, WebSocketDisconnect, Query
from pydantic import BaseModel, Field

from app.services.voice_tutor_service import voice_tutor_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/voice-tutor", tags=["Voice Tutor"])


class VoiceExplainRequest(BaseModel):
    query: Optional[str] = Field(default=None, description="Text question or prompt")
    code_context: Optional[str] = Field(default=None, description="Smart Lab code in Monaco editor")
    error_context: Optional[str] = Field(default=None, description="Compiler error message or execution trace")
    language: str = Field(default="ar", description="Language code: ar or en")
    provider: Optional[str] = None
    model: Optional[str] = None


class VoiceExplainResponse(BaseModel):
    transcription: str
    query_used: str
    explanation: str
    language: str
    has_code_context: bool


@router.post("/explain", response_model=VoiceExplainResponse)
async def explain_text_with_voice(request: VoiceExplainRequest):
    """
    Generate voice tutor explanation from text query and/or code context.
    """
    try:
        res = await voice_tutor_service.process_audio_query(
            text_query=request.query,
            code_context=request.code_context,
            error_context=request.error_context,
            language=request.language,
            provider=request.provider,
            model=request.model,
        )
        return VoiceExplainResponse(**res)
    except Exception as e:
        logger.error(f"Error in voice explain: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/upload-audio", response_model=VoiceExplainResponse)
async def upload_audio_explain(
    audio: UploadFile = File(...),
    code_context: Optional[str] = Form(None),
    error_context: Optional[str] = Form(None),
    language: str = Form("ar"),
    provider: Optional[str] = Form(None),
    model: Optional[str] = Form(None),
):
    """
    Upload recorded audio blob from client microphone, transcribe via Gemini, and generate voice tutor explanation.
    """
    try:
        audio_bytes = await audio.read()
        res = await voice_tutor_service.process_audio_query(
            audio_bytes=audio_bytes,
            audio_filename=audio.filename,
            code_context=code_context,
            error_context=error_context,
            language=language,
            provider=provider,
            model=model,
        )
        return VoiceExplainResponse(**res)
    except Exception as e:
        logger.error(f"Error in upload audio explain: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.websocket("/ws")
async def voice_tutor_websocket(websocket: WebSocket):
    """
    Real-time WebSocket endpoint for low-latency audio interaction and voice tutor explanations.
    """
    await websocket.accept()
    logger.info("Voice Tutor WebSocket connected.")
    
    try:
        while True:
            data = await websocket.receive_json()
            # Incoming schema: {"type": "voice_query", "audio_base64": "...", "code_context": "...", "language": "ar"}
            msg_type = data.get("type", "text_query")
            code_ctx = data.get("code_context")
            err_ctx = data.get("error_context")
            query = data.get("query")
            lang = data.get("language", "ar")

            if msg_type in ["text_query", "voice_query"]:
                await websocket.send_json({"type": "status", "message": "المعلم الصوتي يفكر في إجابة..." if lang == "ar" else "Voice tutor is generating explanation..."})
                
                res = await voice_tutor_service.process_audio_query(
                    text_query=query,
                    code_context=code_ctx,
                    error_context=err_ctx,
                    language=lang,
                )

                await websocket.send_json({
                    "type": "explanation_response",
                    "transcription": res["transcription"],
                    "explanation": res["explanation"],
                    "language": res["language"],
                })

    except WebSocketDisconnect:
        logger.info("Voice Tutor WebSocket disconnected.")
    except Exception as e:
        logger.error(f"Voice Tutor WebSocket error: {e}", exc_info=True)
        try:
            await websocket.send_json({"type": "error", "message": str(e)})
        except Exception:
            pass
