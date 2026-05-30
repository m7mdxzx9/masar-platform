from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional
import logging

from app.services.agents.llm_factory import create_chat_llm_with_fallback

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/tutor", tags=["AI Tutor"])


class TutorRequest(BaseModel):
    query: str = Field(..., min_length=1)
    context: Optional[str] = None
    mode: str = Field(default="explain", description="explain, summarize, quiz, correct, adaptive")
    subject: Optional[str] = None
    skill_id: Optional[str] = None
    provider: Optional[str] = "google"


class TutorResponse(BaseModel):
    response: str
    mode: str
    suggested_review_hours: Optional[float] = None


SYSTEM_PROMPTS = {
    "explain": "You are Masar AI Tutor. Explain the concept clearly in Arabic with examples. Match the user's level.",
    "summarize": "You are Masar AI Tutor. Summarize the given content concisely in Arabic. Include key points.",
    "quiz": "You are Masar AI Tutor. Generate 3-5 quiz questions from the content in Arabic with answers.",
    "correct": "You are Masar AI Tutor. Analyze the code/problem, identify errors, and suggest corrections in Arabic.",
    "adaptive": (
        "You are Masar AI Tutor. Based on the user's query and skill history, provide a tailored learning path. "
        "Assess their current level and suggest what to study next. Respond in Arabic."
    ),
    "code": "You are Masar AI Code Tutor. You write clean, well-commented code, explain programming concepts, and debug errors in Arabic.",
    "math": "You are Masar AI Mathematics Tutor. You solve mathematical, algebra, and calculus problems step-by-step in Arabic with clear steps.",
}



@router.post("/ask", response_model=TutorResponse)
async def tutor_ask(request: TutorRequest):
    try:
        system_prompt = SYSTEM_PROMPTS.get(request.mode, SYSTEM_PROMPTS["explain"])
        if request.subject:
            system_prompt += f"\nSubject area: {request.subject}"

        user_parts = []
        if request.context:
            user_parts.append(f"Context/Content:\n{request.context}\n")
        user_parts.append(f"Query: {request.query}")
        user_message = "\n".join(user_parts)

        llm = create_chat_llm_with_fallback(temperature=0.4, max_tokens=2048, streaming=False, provider=request.provider)
        response = await llm.ainvoke([
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message},
        ])

        review_hours = None
        if request.mode == "adaptive" and request.skill_id:
            review_hours = 24.0

        return TutorResponse(
            response=response.content.strip(),
            mode=request.mode,
            suggested_review_hours=review_hours,
        )
    except Exception as e:
        logger.error(f"Tutor error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/bkt-predict")
async def bkt_predict(request: TutorRequest):
    try:
        llm = create_chat_llm_with_fallback(temperature=0.3, max_tokens=1024, streaming=False, provider=request.provider)
        system = (
            "You are an adaptive learning predictor using Bayesian Knowledge Tracing. "
            "Given a student's query and skill info, estimate their mastery (0-1) and suggest "
            "optimal review time in hours. Respond in JSON format only: "
            '{"mastery": 0.5, "review_hours": 24, "next_concept": "..."}'
        )
        user = (
            f"Student query: {request.query}\n"
            f"Subject: {request.subject or 'general'}\n"
            f"Skill: {request.skill_id or 'unknown'}\n"
            f"Context: {request.context or 'N/A'}"
        )
        response = await llm.ainvoke([
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ])
        import json as json_mod
        try:
            data = json_mod.loads(response.content.strip())
        except json_mod.JSONDecodeError:
            data = {"mastery": 0.5, "review_hours": 24, "next_concept": "Review fundamentals"}

        return {
            "mastery": data.get("mastery", 0.5),
            "review_hours": data.get("review_hours", 24),
            "next_concept": data.get("next_concept", "Continue practice"),
        }
    except Exception as e:
        logger.error(f"BKT error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
