from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Literal
import logging

from app.services.agents.llm_factory import create_chat_llm_with_fallback

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/translate", tags=["Translation"])


class TranslateRequest(BaseModel):
    text: str = Field(..., min_length=1)
    source_lang: Literal["ar", "en"] = "ar"
    target_lang: Literal["ar", "en"] = "en"


class TranslateResponse(BaseModel):
    translated_text: str


@router.post("", response_model=TranslateResponse)
@router.post("/", response_model=TranslateResponse)
async def translate(request: TranslateRequest):
    try:
        llm = create_chat_llm_with_fallback(temperature=0.1, max_tokens=2048, streaming=False)

        system_prompt = (
            f"You are a professional translator. Translate the following text from "
            f"{request.source_lang} to {request.target_lang}. "
            f"Only return the translation, nothing else."
        )

        response = await llm.ainvoke([
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": request.text},
        ])

        translated_text = response.content.strip()

        if not translated_text:
            raise HTTPException(status_code=500, detail="Translation returned empty result")

        return TranslateResponse(translated_text=translated_text)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Translation error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Translation failed: {str(e)}")
