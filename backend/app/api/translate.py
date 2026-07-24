import asyncio
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Literal, List
import logging
from deep_translator import GoogleTranslator

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/translate", tags=["Translation"])

class TranslateRequest(BaseModel):
    text: str = Field(..., min_length=1)
    source_lang: Literal["ar", "en"] = "ar"
    target_lang: Literal["ar", "en"] = "en"

class TranslateResponse(BaseModel):
    meanings: List[str]
    translated_text: str

@router.post("", response_model=TranslateResponse)
@router.post("/", response_model=TranslateResponse)
async def translate(request: TranslateRequest):
    try:
        # Use deep-translator for instant translation
        def sync_translate():
            return GoogleTranslator(source=request.source_lang, target=request.target_lang).translate(request.text)
            
        translated_text = await asyncio.to_thread(sync_translate)
        
        if not translated_text:
            raise HTTPException(status_code=500, detail="Translation returned empty result")

        # For single words, we return it as the first meaning.
        # It's blazing fast and extremely accurate without LLM hallucination.
        meanings = [translated_text]

        return TranslateResponse(meanings=meanings, translated_text=translated_text)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Translation error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Translation failed: {str(e)}")
