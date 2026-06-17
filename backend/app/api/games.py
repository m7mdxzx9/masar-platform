from typing import List
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.models import Challenge, Progress
from app.schemas.schemas import ChallengeCreate, ChallengeRead, ScoreSubmission

router = APIRouter(prefix="/games", tags=["Gamification Engine"])


@router.get("/leaderboard")
async def get_leaderboard(
    limit: int = Query(default=50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(
            Progress.module_id.label("lab_id"),
            func.count(Progress.id).label("attempts"),
            func.avg(Progress.score).label("avg_score"),
            func.max(Progress.score).label("max_score"),
        )
        .group_by(Progress.module_id)
        .order_by(func.max(Progress.score).desc())
        .limit(limit)
    )
    result = await db.execute(stmt)
    rows = result.all()

    leaderboard = []
    for idx, row in enumerate(rows, 1):
        leaderboard.append(
            {
                "rank": idx,
                "lab_id": row[0],
                "attempts": row[1],
                "avg_score": float(row[2]) if row[2] else 0,
                "max_score": row[3] or 0,
            }
        )

    return {
        "leaderboard": leaderboard,
        "total_entries": len(leaderboard),
    }


@router.get("/challenges", response_model=List[ChallengeRead])
async def get_challenges(
    category: str = Query(default="all"),
    active_only: bool = Query(default=True),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Challenge)
    if category != "all":
        stmt = stmt.where(Challenge.category == category)
    if active_only:
        stmt = stmt.where(Challenge.is_active == True)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.post("/challenges", response_model=ChallengeRead)
async def create_challenge(challenge_in: ChallengeCreate, db: AsyncSession = Depends(get_db)):
    challenge = Challenge(**challenge_in.model_dump())
    db.add(challenge)
    await db.flush()
    await db.refresh(challenge)
    return challenge


@router.post("/submit-score")
async def submit_score(submission: ScoreSubmission, db: AsyncSession = Depends(get_db)):
    final_score = submission.score + (submission.streak_bonus * 10)
    return {
        "success": True,
        "challenge_id": submission.challenge_id,
        "raw_score": submission.score,
        "streak_bonus": submission.streak_bonus,
        "final_score": final_score,
        "message": "Score submitted successfully!",
    }


from pydantic import BaseModel
import re
import json
import random
from typing import Optional

class ChallengeGenerationRequest(BaseModel):
    game_type: str  # 'vocab-blitz', 'code-debugging', 'math-duel'
    seed: Optional[int] = None
    temperature: Optional[float] = 0.7

@router.post("/challenges/generate")
async def generate_dynamic_challenge(req: ChallengeGenerationRequest):
    if req.seed is not None:
        random.seed(req.seed)
    
    from app.services.study_service import _llm_call
    
    # We want to generate dynamic educational content
    if req.game_type == "vocab-blitz":
        system = "You are an AI educational game developer. Generate a set of 10 tech vocabulary pairs in English and Arabic."
        user = (
            f"Generate 10 advanced machine learning, programming, or AI vocabulary pairs. "
            f"Random seed tag: {req.seed or random.random()}. "
            f"Return ONLY a valid JSON object matching this schema:\n"
            f"{{\n"
            f"  \"pairs\": [\n"
            f"    {{\"id\": 1, \"en\": \"Overfitting\", \"ar\": \"الفرط في التدريب\"}},\n"
            f"    ...\n"
            f"  ]\n"
            f"}}\n"
            f"Do not include markdown code block formatting (e.g. ```json). Output raw valid JSON only."
        )
        try:
            res_text = await _llm_call(system, user, temperature=req.temperature)
            clean_text = re.sub(r"```(?:json)?\s*|\s*```", "", res_text).strip()
            return json.loads(clean_text)
        except Exception as e:
            # Local fallback pairs if AI fails
            return {"pairs": [
                { "id": 1, "en": "Epoch", "ar": "دورة تدريبية كاملة" },
                { "id": 2, "en": "Neural Network", "ar": "الشبكة العصبية" },
                { "id": 3, "en": "Gradient Descent", "ar": "النزول التدريجي للمنحدر" },
                { "id": 4, "en": "Machine Learning", "ar": "تعلم الآلة" },
                { "id": 5, "en": "Hyperparameter", "ar": "معامل الضبط الفوقي" },
                { "id": 6, "en": "Data Augmentation", "ar": "زيادة البيانات" },
                { "id": 7, "en": "Supervised Learning", "ar": "التعلم الخاضع للإشراف" },
                { "id": 8, "en": "Reinforcement Learning", "ar": "التعلم التعزيزي" },
                { "id": 9, "en": "Computer Vision", "ar": "الرؤية الحاسوبية" },
                { "id": 10, "en": "Natural Language Processing", "ar": "معالجة اللغة الطبيعية" }
            ]}

    elif req.game_type == "code-debugging":
        system = "You are a Python programming tutor. Generate 5 unique code debugging questions for students."
        user = (
            f"Generate 5 Python debugging questions where the student has to identify the syntax or logical bug. "
            f"Random seed tag: {req.seed or random.random()}. "
            f"Return ONLY a valid JSON object matching this schema:\n"
            f"{{\n"
            f"  \"questions\": [\n"
            f"    {{\n"
            f"      \"code\": \"def calculate_sum(a, b)\\n    return a + b\",\n"
            f"      \"question\": \"ما هو الخطأ في هذا الكود البرمجي؟\",\n"
            f"      \"options\": [\"إضافة نقطتين (:) في نهاية سطر تعريف الدالة\", \"حذف الكلمة المفتاحية def\", \"يجب وضع المتغيرات بين علامتي اقتباس\", \"لا يوجد خطأ\"],\n"
            f"      \"correctIndex\": 0,\n"
            f"      \"explanation\": \"في بايثون، يجب وضع نقطتين (:) في نهاية سطر تعريف الدالة.\"\n"
            f"    }}\n"
            f"  ]\n"
            f"}}\n"
            f"Do not include markdown code block formatting. Output raw valid JSON only."
        )
        try:
            res_text = await _llm_call(system, user, temperature=req.temperature)
            clean_text = re.sub(r"```(?:json)?\s*|\s*```", "", res_text).strip()
            return json.loads(clean_text)
        except Exception as e:
            return {"questions": [
                {
                    "code": "def hello_world()\n  print('Hello')",
                    "question": "ما هو الخطأ في هذا الكود البرمجي؟",
                    "options": [
                        "إضافة نقطتين (:) في نهاية سطر تعريف الدالة",
                        "استخدام علامة اقتباس مفردة",
                        "عدم كتابة return",
                        "لا يوجد خطأ"
                    ],
                    "correctIndex": 0,
                    "explanation": "في بايثون، يجب وضع نقطتين (:) في نهاية سطر تعريف الدالة."
                }
            ]}

    elif req.game_type == "math-duel":
        system = "You are an AI theory and Mathematics professor. Generate 5 unique mathematical or neural network theory questions."
        user = (
            f"Generate 5 multiple-choice questions on Linear Algebra, Calculus, or AI theory. "
            f"Random seed tag: {req.seed or random.random()}. "
            f"Return ONLY a valid JSON object matching this schema:\n"
            f"{{\n"
            f"  \"questions\": [\n"
            f"    {{\n"
            f"      \"question\": \"ما هي قيمة مخرجات دالة ReLU للمدخل x = -5؟\",\n"
            f"      \"options\": [\"-5\", \"0\", \"1\", \"5\"],\n"
            f"      \"correctIndex\": 1,\n"
            f"      \"explanation\": \"ReLU تعيد max(0, x)، لذلك للمدخل السالب تعيد 0.\"\n"
            f"    }}\n"
            f"  ]\n"
            f"}}\n"
            f"Do not include markdown code block formatting. Output raw valid JSON only."
        )
        try:
            res_text = await _llm_call(system, user, temperature=req.temperature)
            clean_text = re.sub(r"```(?:json)?\s*|\s*```", "", res_text).strip()
            return json.loads(clean_text)
        except Exception as e:
            return {"questions": [
                {
                    "question": "ما هي قيمة مخرجات دالة ReLU للمدخل x = -5؟",
                    "options": ["-5", "0", "1", "5"],
                    "correctIndex": 1,
                    "explanation": "ReLU تعيد max(0, x)، لذلك للمدخل السالب تعيد 0."
                }
            ]}

    else:
        raise HTTPException(status_code=400, detail="Invalid game type")
