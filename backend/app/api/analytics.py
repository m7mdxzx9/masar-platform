from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timedelta

from app.core.database import get_db
from app.models.models import Subject, Note, Course, Goal, FocusSession, Progress, CodeSnippet

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/overview")
async def get_analytics_overview(db: AsyncSession = Depends(get_db)):
    now = datetime.utcnow()
    week_ago = now - timedelta(days=7)

    subject_count = (await db.execute(select(func.count(Subject.id)))).scalar() or 0
    note_count = (await db.execute(select(func.count(Note.id)))).scalar() or 0
    course_count = (await db.execute(select(func.count(Course.id)))).scalar() or 0
    goal_count = (await db.execute(select(func.count(Goal.id)))).scalar() or 0
    snippet_count = (await db.execute(select(func.count(CodeSnippet.id)))).scalar() or 0

    recent_notes = (await db.execute(
        select(func.count(Note.id)).where(Note.created_at >= week_ago)
    )).scalar() or 0

    focus_result = await db.execute(
        select(func.coalesce(func.sum(FocusSession.duration), 0)).where(
            FocusSession.created_at >= week_ago
        )
    )
    focus_seconds = focus_result.scalar() or 0

    completed_goals = (await db.execute(
        select(func.count(Goal.id)).where(Goal.completed == True)
    )).scalar() or 0

    return {
        "subjects": subject_count,
        "notes": note_count,
        "courses": course_count,
        "goals": goal_count,
        "snippets": snippet_count,
        "recent_notes_7d": recent_notes,
        "focus_minutes_7d": focus_seconds // 60,
        "completed_goals": completed_goals,
        "period": {
            "from": week_ago.isoformat(),
            "to": now.isoformat(),
        },
    }


@router.get("/progress")
async def get_progress_stats(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Progress))
    rows = result.scalars().all()

    skills = {}
    total_attempts = 0
    total_correct = 0
    for p in rows:
        skills[p.skill_id] = skills.get(p.skill_id, 0) + 1
        total_attempts += 1
        if hasattr(p, 'is_correct') and p.is_correct:
            total_correct += 1

    mastery_distribution = {"beginner": 0, "intermediate": 0, "advanced": 0, "mastered": 0}
    for p in rows:
        if hasattr(p, 'mastery_level'):
            level = p.mastery_level or "beginner"
            if level in mastery_distribution:
                mastery_distribution[level] += 1

    accuracy = (total_correct / total_attempts * 100) if total_attempts > 0 else 0

    return {
        "total_skills_tracked": len(skills),
        "total_attempts": total_attempts,
        "total_correct": total_correct,
        "accuracy_percent": round(accuracy, 1),
        "mastery_distribution": mastery_distribution,
    }


@router.get("/focus")
async def get_focus_stats(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(FocusSession).order_by(FocusSession.created_at.desc()))
    sessions = result.scalars().all()

    total_seconds = sum(s.duration for s in sessions if hasattr(s, 'duration'))
    total_sessions = len(sessions)
    daily: dict[str, int] = {}
    for s in sessions:
        if hasattr(s, 'created_at') and s.created_at and hasattr(s, 'duration'):
            day = s.created_at.strftime("%Y-%m-%d")
            daily[day] = daily.get(day, 0) + s.duration

    return {
        "total_sessions": total_sessions,
        "total_minutes": total_seconds // 60,
        "avg_session_minutes": (total_seconds // max(total_sessions, 1)) // 60,
        "daily_minutes": {k: v // 60 for k, v in sorted(daily.items())},
    }


@router.get("/activity")
async def get_activity_log(
    db: AsyncSession = Depends(get_db),
    limit: int = Query(default=50, le=200),
):
    all_events = []

    notes = await db.execute(select(Note).order_by(Note.updated_at.desc()).limit(limit))
    for n in notes.scalars().all():
        if n.updated_at:
            all_events.append({
                "type": "note",
                "action": "updated" if n.created_at != n.updated_at else "created",
                "title": n.title,
                "timestamp": n.updated_at.isoformat() if n.updated_at else "",
            })

    goals = await db.execute(select(Goal).order_by(Goal.updated_at.desc()).limit(limit))
    for g in goals.scalars().all():
        if g.updated_at:
            all_events.append({
                "type": "goal",
                "action": "completed" if getattr(g, 'completed', False) else "updated",
                "title": g.title,
                "timestamp": g.updated_at.isoformat() if g.updated_at else "",
            })

    all_events.sort(key=lambda e: e.get("timestamp", ""), reverse=True)
    return {"events": all_events[:limit]}
