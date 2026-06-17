from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Literal, List
import logging
import json

from app.services.agents.llm_factory import create_chat_llm_with_fallback
from app.core.config import settings

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
        llm = None
        try:
            llm = create_chat_llm_with_fallback(temperature=0.1, max_tokens=2048, streaming=False, provider="google")
        except Exception as e:
            logger.warning(f"Could not instantiate Google provider for translation: {e}")

        response = None
        if request.target_lang == "ar" and len(request.text.split()) == 1:
            # Word-level translation with polysemy support
            system_prompt = (
                "You are an expert bilingual dictionary. Translate the given English word into Arabic. "
                "Since words often have multiple meanings or contexts, provide all primary and secondary Arabic translations. "
                "Output your response strictly as a JSON array of strings (e.g. [\"تفاحة\", \"شركة آبل\"]). "
                "Do not include any formatting, markdown backticks, or explanation. Only output the raw JSON array."
            )
        else:
            # General sentence translation
            system_prompt = (
                f"You are a professional translator. Translate the following text from "
                f"{request.source_lang} to {request.target_lang}.\n"
                f"CRITICAL REQUIREMENTS:\n"
                f"1. You MUST preserve the exact structure, line breaks, paragraph separations, and markdown formatting of the original text. Do not merge paragraphs or list items.\n"
                f"2. You MUST keep all bullet points (e.g. '-' or '*'), numbered lists (e.g. '1.', '2.'), headers (e.g. '####'), bold text ('**'), and math blocks completely intact.\n"
                f"3. You MUST NOT translate, modify, or add spaces inside placeholders formatted like [[INLINE_P_x]] or [[BLOCK_P_x]] (where x is a number). Keep them exactly as they are in the source text.\n"
                f"4. Only return the translated text, nothing else."
            )

        if llm:
            try:
                response = await llm.ainvoke([
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": request.text},
                ])
            except Exception as e:
                logger.warning(f"Translation with Google provider failed: {e}. Trying default provider...")
                llm = None

        if not llm or response is None:
            llm = create_chat_llm_with_fallback(temperature=0.1, max_tokens=2048, streaming=False)
            response = await llm.ainvoke([
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": request.text},
            ])

        raw_output = response.content.strip()
        
        meanings = []
        translated_text = ""
        
        if request.target_lang == "ar" and len(request.text.split()) == 1:
            try:
                # Clean potential markdown block formatting
                cleaned = raw_output
                if cleaned.startswith("```"):
                    # split by first newline
                    if "\n" in cleaned:
                        cleaned = cleaned.split("\n", 1)[1]
                    else:
                        cleaned = cleaned.replace("```json", "").replace("```", "")
                if cleaned.endswith("```"):
                    cleaned = cleaned.rsplit("```", 1)[0]
                cleaned = cleaned.strip()
                
                parsed = json.loads(cleaned)
                if isinstance(parsed, list):
                    meanings = [str(x).strip() for x in parsed]
                    translated_text = "، ".join(meanings)
                else:
                    meanings = [str(parsed)]
                    translated_text = str(parsed)
            except Exception as e:
                logger.warning(f"Failed to parse polysemy JSON: {e}. Raw: {raw_output}")
                translated_text = raw_output
                meanings = [raw_output]
        else:
            translated_text = raw_output
            meanings = [raw_output]

        if not translated_text:
            raise HTTPException(status_code=500, detail="Translation returned empty result")

        return TranslateResponse(meanings=meanings, translated_text=translated_text)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Translation error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Translation failed: {str(e)}")
