from datetime import datetime, timezone, timedelta
from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.models.models import FocusSession
from app.schemas.schemas import FocusSessionCreate, FocusSessionRead

router = APIRouter(prefix="/focus", tags=["Focus"])


@router.post("/sessions", response_model=FocusSessionRead)
async def create_session(session_in: FocusSessionCreate, db: AsyncSession = Depends(get_db)):
    session = FocusSession(
        start_time=session_in.start_time or datetime.now(timezone.utc),
        end_time=session_in.end_time,
        duration=session_in.duration,
        session_type=session_in.session_type,
        completed=session_in.completed,
    )
    db.add(session)
    await db.flush()
    await db.refresh(session)
    return session


@router.get("/sessions", response_model=List[FocusSessionRead])
async def list_sessions(limit: int = 50, db: AsyncSession = Depends(get_db)):
    stmt = select(FocusSession).order_by(FocusSession.created_at.desc()).limit(limit)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/stats")
async def get_focus_stats(db: AsyncSession = Depends(get_db)):
    today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    
    # Today total
    today_stmt = select(func.coalesce(func.sum(FocusSession.duration), 0)).where(
        FocusSession.created_at >= today,
        FocusSession.session_type == "focus",
        FocusSession.completed == True,
    )
    today_result = await db.execute(today_stmt)
    today_seconds = today_result.scalar() or 0
    
    # Weekly total — find most recent Saturday
    week_start = today
    while week_start.weekday() != 5:
        week_start -= timedelta(days=1)
    week_stmt = select(func.coalesce(func.sum(FocusSession.duration), 0)).where(
        FocusSession.created_at >= week_start,
        FocusSession.session_type == "focus",
        FocusSession.completed == True,
    )
    week_result = await db.execute(week_stmt)
    week_seconds = week_result.scalar() or 0
    
    # Session count today
    count_stmt = select(func.count(FocusSession.id)).where(
        FocusSession.created_at >= today,
        FocusSession.session_type == "focus",
        FocusSession.completed == True,
    )
    count_result = await db.execute(count_stmt)
    session_count = count_result.scalar() or 0
    
    return {
        "today_seconds": today_seconds,
        "today_minutes": round(today_seconds / 60, 1),
        "week_seconds": week_seconds,
        "week_minutes": round(week_seconds / 60, 1),
        "session_count_today": session_count,
    }


@router.get("/heatmap")
async def get_heatmap(days: int = 365, db: AsyncSession = Depends(get_db)):
    start_date = datetime.now(timezone.utc) - timedelta(days=days)
    stmt = select(
        func.date(FocusSession.created_at).label("date"),
        func.coalesce(func.sum(FocusSession.duration), 0).label("minutes"),
    ).where(
        FocusSession.created_at >= start_date,
        FocusSession.session_type == "focus",
        FocusSession.completed == True,
    ).group_by(func.date(FocusSession.created_at)).order_by(func.date(FocusSession.created_at))

    result = await db.execute(stmt)
    daily: dict[str, int] = {}
    for row in result:
        date_str = row.date.isoformat() if hasattr(row.date, "isoformat") else str(row.date)
        daily[date_str] = round((row.minutes or 0) / 60, 1)

    return {"daily": daily}
