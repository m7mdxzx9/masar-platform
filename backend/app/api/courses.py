from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends, Query, File, UploadFile
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


@router.post("/generate-from-syllabus", response_model=CourseRead)
async def generate_from_syllabus(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF syllabus files are supported")
    
    try:
        content = await file.read()
        
        import fitz
        doc = fitz.open(stream=content, filetype="pdf")
        text = ""
        for page in doc:
            text += page.get_text()
            
        trimmed_text = text[:50000]
        
        import json
        from google import genai
        from google.genai import types
        from app.core.config import settings
        
        if not settings.google_api_key:
            parsed_course = {
                "title": f"مسار {file.filename.replace('.pdf', '')}",
                "description": "مسار تعليمي تم إنشاؤه تلقائياً من المنهج الدراسي المرفوع.",
                "category": "General",
                "difficulty": 3,
                "modules": [
                    {
                        "id": "module_1",
                        "title": "المقدمة والأساسيات العامة",
                        "description": "نظرة عامة على محتويات المقرر وأهدافه والأسس الهامة."
                    },
                    {
                        "id": "module_2",
                        "title": "المحاور الرئيسية والشبكات",
                        "description": "دراسة المفاهيم المتقدمة والتطبيقات العملية الخاصة بالمنهج."
                    }
                ]
            }
        else:
            client = genai.Client(api_key=settings.google_api_key)
            prompt = f"""
            You are an academic syllabus parser. Analyze the syllabus text below and extract a structured study learning path.
            Return ONLY a JSON object matching this structure:
            {{
              "title": "The course title",
              "description": "Short description of the course",
              "category": "Subject category (e.g. Computer Science, Mathematics, AI)",
              "difficulty": 3,
              "modules": [
                {{
                  "id": "module_1",
                  "title": "Module Title",
                  "description": "Module objectives and topics covered"
                }}
              ]
            }}
            
            Make sure the titles and descriptions are in Arabic if the input syllabus is in Arabic (or bilingual), otherwise in English.
            
            Syllabus text:
            {trimmed_text}
            """
            
            response = client.models.generate_content(
                model="gemini-1.5-flash",
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json"
                )
            )
            
            parsed_course = json.loads(response.text.strip())
            
        course = Course(
            user_id=1,
            title=parsed_course.get("title", f"مسار {file.filename.replace('.pdf', '')}"),
            description=parsed_course.get("description", "مسار دراسي مخصص"),
            category=parsed_course.get("category", "General"),
            difficulty=parsed_course.get("difficulty", 3),
            modules=parsed_course.get("modules", [])
        )
        db.add(course)
        await db.flush()
        await db.refresh(course)
        return course
        
    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f"Syllabus parsing error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to generate course syllabus: {str(e)}")
