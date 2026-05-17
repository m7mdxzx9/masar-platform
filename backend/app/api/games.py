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
