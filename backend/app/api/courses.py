from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models.models import Course, Progress
from app.schemas.schemas import CourseCreate, CourseRead, ProgressCreate, ProgressRead

router = APIRouter(prefix="/courses", tags=["Learning Paths"])


@router.get("/", response_model=List[CourseRead])
async def get_courses(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    category: Optional[str] = Query(default=None),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Course).options(selectinload(Course.progress_records)).offset(skip).limit(limit)
    if category:
        stmt = stmt.where(Course.category == category)
    result = await db.execute(stmt)
    courses = result.scalars().unique().all()
    return courses


@router.get("/{course_id}", response_model=CourseRead)
async def get_course(course_id: int, db: AsyncSession = Depends(get_db)):
    stmt = select(Course).options(selectinload(Course.progress_records)).where(Course.id == course_id)
    result = await db.execute(stmt)
    course = result.scalars().first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return course


@router.post("/", response_model=CourseRead)
async def create_course(course_in: CourseCreate, db: AsyncSession = Depends(get_db)):
    course = Course(**course_in.model_dump())
    db.add(course)
    await db.flush()
    await db.refresh(course)
    return course


@router.put("/{course_id}", response_model=CourseRead)
async def update_course(course_id: int, course_in: CourseCreate, db: AsyncSession = Depends(get_db)):
    stmt = select(Course).where(Course.id == course_id)
    result = await db.execute(stmt)
    course = result.scalars().first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    for key, value in course_in.model_dump().items():
        setattr(course, key, value)
    await db.flush()
    await db.refresh(course)
    return course


@router.delete("/{course_id}")
async def delete_course(course_id: int, db: AsyncSession = Depends(get_db)):
    stmt = select(Course).where(Course.id == course_id)
    result = await db.execute(stmt)
    course = result.scalars().first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    await db.delete(course)
    await db.flush()
    return {"success": True, "message": f"Course {course_id} deleted"}


@router.get("/{course_id}/progress", response_model=List[ProgressRead])
async def get_course_progress(course_id: int, db: AsyncSession = Depends(get_db)):
    stmt = select(Progress).where(Progress.course_id == course_id)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.post("/{course_id}/progress", response_model=ProgressRead)
async def upsert_progress(course_id: int, progress_in: ProgressCreate, db: AsyncSession = Depends(get_db)):
    stmt = select(Progress).where(
        Progress.course_id == course_id,
        Progress.module_id == progress_in.module_id,
    )
    result = await db.execute(stmt)
    existing = result.scalars().first()

    if existing:
        existing.completion_percentage = progress_in.completion_percentage
        existing.score = progress_in.score
        if progress_in.completion_percentage >= 100.0:
            from datetime import datetime, timezone
            existing.is_completed = True
            existing.completed_at = datetime.now(timezone.utc)
        await db.flush()
        await db.refresh(existing)
        return existing

    progress = Progress(
        course_id=course_id,
        module_id=progress_in.module_id,
        completion_percentage=progress_in.completion_percentage,
        score=progress_in.score,
    )
    if progress_in.completion_percentage >= 100.0:
        from datetime import datetime, timezone
        progress.is_completed = True
        progress.completed_at = datetime.now(timezone.utc)
    db.add(progress)
    await db.flush()
    await db.refresh(progress)
    return progress
