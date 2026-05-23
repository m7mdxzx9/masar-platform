from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.models.models import Goal
from app.schemas.schemas import GoalCreate, GoalUpdate, GoalRead

router = APIRouter(prefix="/goals", tags=["Goals"])


@router.post("", response_model=GoalRead)
async def create_goal(goal_in: GoalCreate, db: AsyncSession = Depends(get_db)):
    goal = Goal(**goal_in.model_dump())
    db.add(goal)
    await db.flush()
    await db.refresh(goal)
    return goal


@router.get("", response_model=List[GoalRead])
async def list_goals(db: AsyncSession = Depends(get_db)):
    stmt = select(Goal).order_by(Goal.created_at.desc())
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/{goal_id}", response_model=GoalRead)
async def get_goal(goal_id: int, db: AsyncSession = Depends(get_db)):
    stmt = select(Goal).where(Goal.id == goal_id)
    result = await db.execute(stmt)
    goal = result.scalar_one_or_none()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    return goal


@router.put("/{goal_id}", response_model=GoalRead)
async def update_goal(goal_id: int, goal_in: GoalUpdate, db: AsyncSession = Depends(get_db)):
    stmt = select(Goal).where(Goal.id == goal_id)
    result = await db.execute(stmt)
    goal = result.scalar_one_or_none()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    for key, value in goal_in.model_dump(exclude_none=True).items():
        setattr(goal, key, value)
    await db.flush()
    await db.refresh(goal)
    return goal


@router.delete("/{goal_id}")
async def delete_goal(goal_id: int, db: AsyncSession = Depends(get_db)):
    stmt = select(Goal).where(Goal.id == goal_id)
    result = await db.execute(stmt)
    goal = result.scalar_one_or_none()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    await db.delete(goal)
    await db.flush()
    return {"success": True}
