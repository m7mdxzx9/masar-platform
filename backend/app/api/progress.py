"""
Progress API — Adaptive Learning with BKT
مسارات التقدم الدراسي والتعلم التكيفي
"""
from fastapi import APIRouter, HTTPException, Query, Depends
from typing import Optional
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.services.learning_engine import evaluate_attempt, BayesianKnowledgeTracing
from app.core.database import get_db
from app.models.models import SkillState, Skill

router = APIRouter(prefix="/progress", tags=["progress"])


class QuizSubmitRequest(BaseModel):
    module_id: str
    question_id: str
    skill_id: str
    is_correct: bool
    time_spent: float = Field(default=0.0, ge=0.0)


class QuizSubmitResponse(BaseModel):
    skill_id: str
    mastery: float
    mastery_level: str
    difficulty: str
    next_action: str
    attempts: int
    correct: int
    accuracy: float


class MasteryResponse(BaseModel):
    skill_id: str
    mastery: float
    mastery_level: str


class LearningPathItem(BaseModel):
    skill_id: str
    mastery: float
    mastery_level: str
    next_action: str


class StatsResponse(BaseModel):
    total_skills: int
    mastered: int
    average_mastery: float


@router.post("/quiz-submit", response_model=QuizSubmitResponse)
async def quiz_submit(req: QuizSubmitRequest, db: AsyncSession = Depends(get_db)):
    """تحديث إتقان المهارة بعد إجابة الطالب."""
    # سنستخدم user_id = 0 كافتراضي حتى يتم إضافة نظام المصادقة
    user_id = 0
    
    # 1. جلب الحالة الحالية من قاعدة البيانات
    stmt = select(SkillState).where(SkillState.skill_id == req.skill_id, SkillState.user_id == user_id)
    result = await db.execute(stmt)
    state = result.scalar_one_or_none()
    
    current_mastery = state.p_know if state else 0.0
    attempts = state.attempts if state else 0
    correct = state.correct if state else 0
    
    # 2. حساب التحديث باستخدام محرك التعلم
    updated_metrics = evaluate_attempt(
        current_p_know=current_mastery,
        is_correct=req.is_correct,
        skill_id=req.skill_id,
        attempts=attempts,
        correct=correct,
        time_spent=req.time_spent,
    )
    
    # 3. حفظ التحديث في قاعدة البيانات
    if not state:
        # التأكد من وجود المهارة أولاً
        skill_stmt = select(Skill).where(Skill.id == req.skill_id)
        skill_exists = (await db.execute(skill_stmt)).scalar_one_or_none()
        if not skill_exists:
            # إنشاء مهارة افتراضية إذا لم تكن موجودة (للتبسيط حالياً)
            new_skill = Skill(id=req.skill_id, name=req.skill_id.replace("_", " ").title())
            db.add(new_skill)
            await db.flush()
            
        state = SkillState(
            user_id=user_id,
            skill_id=req.skill_id,
            p_know=updated_metrics["mastery"],
            attempts=updated_metrics["attempts"],
            correct=updated_metrics["correct"]
        )
        db.add(state)
    else:
        state.p_know = updated_metrics["mastery"]
        state.attempts = updated_metrics["attempts"]
        state.correct = updated_metrics["correct"]
    
    await db.commit()
    return QuizSubmitResponse(**updated_metrics)


@router.get("/mastery/{skill_id}", response_model=MasteryResponse)
async def get_mastery(skill_id: str, db: AsyncSession = Depends(get_db)):
    """الحصول على مستوى إتقان مهارة معينة."""
    user_id = 0
    stmt = select(SkillState).where(SkillState.skill_id == skill_id, SkillState.user_id == user_id)
    result = await db.execute(stmt)
    state = result.scalar_one_or_none()
    
    if not state:
        return MasteryResponse(skill_id=skill_id, mastery=0.0, mastery_level="beginner")
    
    return MasteryResponse(
        skill_id=state.skill_id,
        mastery=state.p_know,
        mastery_level=BayesianKnowledgeTracing.mastery_level(state.p_know),
    )


@router.get("/learning-path", response_model=list[LearningPathItem])
async def learning_path(
    skill_ids: str = Query(..., description="Comma-separated skill IDs"),
    db: AsyncSession = Depends(get_db)
):
    """مسار التعلم لمجموعة مهارات."""
    user_id = 0
    ids = [s.strip() for s in skill_ids.split(",") if s.strip()]
    
    stmt = select(SkillState).where(SkillState.skill_id.in_(ids), SkillState.user_id == user_id)
    result = await db.execute(stmt)
    states = {s.skill_id: s for s in result.scalars().all()}
    
    items: list[LearningPathItem] = []
    for sid in ids:
        state = states.get(sid)
        if state:
            items.append(LearningPathItem(
                skill_id=sid,
                mastery=state.p_know,
                mastery_level=BayesianKnowledgeTracing.mastery_level(state.p_know),
                next_action=BayesianKnowledgeTracing.next_action(state.p_know),
            ))
        else:
            items.append(LearningPathItem(
                skill_id=sid, mastery=0.0, mastery_level="beginner", next_action="remedial"
            ))
    return items


@router.get("/stats", response_model=StatsResponse)
async def stats(db: AsyncSession = Depends(get_db)):
    """إحصائيات عامة عن تقدم الطالب."""
    user_id = 0
    stmt = select(SkillState).where(SkillState.user_id == user_id)
    result = await db.execute(stmt)
    states = result.scalars().all()
    
    total = len(states)
    mastered = sum(1 for s in states if s.p_know >= 0.9)
    avg = (sum(s.p_know for s in states) / total) if total else 0.0
    return StatsResponse(total_skills=total, mastered=mastered, average_mastery=round(avg, 3))
