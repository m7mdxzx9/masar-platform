import os
import shutil
import uuid
from fastapi import APIRouter, HTTPException, UploadFile, File, Depends
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from typing import Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import async_session_factory
from app.models.models import Subject as SubjectModel, SubjectFile as SubjectFileModel

router = APIRouter(prefix="/subjects", tags=["subjects"])

UPLOAD_BASE = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads", "subjects")


async def get_session():
    async with async_session_factory() as session:
        yield session


class SubjectCreate(BaseModel):
    name: str = Field(..., min_length=1)
    code: Optional[str] = None
    instructor: Optional[str] = None
    schedule_day: Optional[str] = None
    schedule_time: Optional[str] = None
    room: Optional[str] = None
    color: Optional[str] = None
    notes: Optional[str] = None


class SubjectUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    instructor: Optional[str] = None
    schedule_day: Optional[str] = None
    schedule_time: Optional[str] = None
    room: Optional[str] = None
    color: Optional[str] = None
    notes: Optional[str] = None


@router.get("/")
async def list_subjects():
    async with async_session_factory() as session:
        result = await session.execute(select(SubjectModel).order_by(SubjectModel.created_at.desc()))
        subjects = result.scalars().all()
        output = []
        for s in subjects:
            output.append({
                "id": s.id,
                "name": s.name,
                "code": s.code,
                "instructor": s.instructor,
                "schedule_day": s.schedule_day,
                "schedule_time": s.schedule_time,
                "room": s.room,
                "color": s.color,
                "notes": s.notes,
                "file_count": len(s.files) if s.files else 0,
                "created_at": s.created_at.isoformat() if s.created_at else None,
                "updated_at": s.updated_at.isoformat() if s.updated_at else None,
            })
        return {"subjects": output}


@router.get("/{subject_id}")
async def get_subject(subject_id: int):
    async with async_session_factory() as session:
        result = await session.execute(select(SubjectModel).where(SubjectModel.id == subject_id))
        subject = result.scalar_one_or_none()
        if not subject:
            raise HTTPException(status_code=404, detail="Subject not found")
        files = []
        for f in (subject.files or []):
            files.append({
                "id": f.id,
                "filename": f.filename,
                "original_name": f.original_name,
                "file_type": f.file_type,
                "file_size": f.file_size,
                "uploaded_at": f.uploaded_at.isoformat() if f.uploaded_at else None,
            })
        return {
            "id": subject.id,
            "name": subject.name,
            "code": subject.code,
            "instructor": subject.instructor,
            "schedule_day": subject.schedule_day,
            "schedule_time": subject.schedule_time,
            "room": subject.room,
            "color": subject.color,
            "notes": subject.notes,
            "files": files,
            "created_at": subject.created_at.isoformat() if subject.created_at else None,
            "updated_at": subject.updated_at.isoformat() if subject.updated_at else None,
        }


@router.post("/")
async def create_subject(data: SubjectCreate):
    async with async_session_factory() as session:
        subject = SubjectModel(
            name=data.name,
            code=data.code,
            instructor=data.instructor,
            schedule_day=data.schedule_day,
            schedule_time=data.schedule_time,
            room=data.room,
            color=data.color,
            notes=data.notes,
        )
        session.add(subject)
        await session.commit()
        await session.refresh(subject)
        return {
            "id": subject.id,
            "name": subject.name,
            "code": subject.code,
            "instructor": subject.instructor,
            "schedule_day": subject.schedule_day,
            "schedule_time": subject.schedule_time,
            "room": subject.room,
            "color": subject.color,
            "notes": subject.notes,
            "created_at": subject.created_at.isoformat() if subject.created_at else None,
        }


@router.put("/{subject_id}")
async def update_subject(subject_id: int, data: SubjectUpdate):
    async with async_session_factory() as session:
        result = await session.execute(select(SubjectModel).where(SubjectModel.id == subject_id))
        subject = result.scalar_one_or_none()
        if not subject:
            raise HTTPException(status_code=404, detail="Subject not found")
        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(subject, key, value)
        await session.commit()
        await session.refresh(subject)
        return {"id": subject.id, "name": subject.name, "updated_at": subject.updated_at.isoformat() if subject.updated_at else None}


@router.delete("/{subject_id}")
async def delete_subject(subject_id: int):
    async with async_session_factory() as session:
        result = await session.execute(select(SubjectModel).where(SubjectModel.id == subject_id))
        subject = result.scalar_one_or_none()
        if not subject:
            raise HTTPException(status_code=404, detail="Subject not found")
        subject_dir = os.path.join(UPLOAD_BASE, str(subject_id))
        if os.path.exists(subject_dir):
            shutil.rmtree(subject_dir)
        await session.delete(subject)
        await session.commit()
        return {"success": True}


@router.post("/{subject_id}/files")
async def upload_file(subject_id: int, file: UploadFile = File(...)):
    async with async_session_factory() as session:
        result = await session.execute(select(SubjectModel).where(SubjectModel.id == subject_id))
        subject = result.scalar_one_or_none()
        if not subject:
            raise HTTPException(status_code=404, detail="Subject not found")

        subject_dir = os.path.join(UPLOAD_BASE, str(subject_id))
        os.makedirs(subject_dir, exist_ok=True)

        ext = os.path.splitext(file.filename or "file")[1]
        unique_name = f"{uuid.uuid4().hex}{ext}"
        file_path = os.path.join(subject_dir, unique_name)

        content = await file.read()
        with open(file_path, "wb") as f:
            f.write(content)

        db_file = SubjectFileModel(
            subject_id=subject_id,
            filename=unique_name,
            original_name=file.filename or "file",
            file_type=file.content_type or "application/octet-stream",
            file_size=len(content),
            file_path=file_path,
        )
        session.add(db_file)
        await session.commit()
        await session.refresh(db_file)
        return {
            "id": db_file.id,
            "filename": db_file.filename,
            "original_name": db_file.original_name,
            "file_type": db_file.file_type,
            "file_size": db_file.file_size,
            "uploaded_at": db_file.uploaded_at.isoformat() if db_file.uploaded_at else None,
        }


@router.post("/upload")
async def upload_file_direct(subject_id: int, file: UploadFile = File(...)):
    return await upload_file(subject_id=subject_id, file=file)



@router.get("/{subject_id}/files")
async def list_files(subject_id: int):
    async with async_session_factory() as session:
        result = await session.execute(
            select(SubjectFileModel).where(SubjectFileModel.subject_id == subject_id).order_by(SubjectFileModel.uploaded_at.desc())
        )
        files = result.scalars().all()
        return {
            "files": [
                {
                    "id": f.id,
                    "filename": f.filename,
                    "original_name": f.original_name,
                    "file_type": f.file_type,
                    "file_size": f.file_size,
                    "uploaded_at": f.uploaded_at.isoformat() if f.uploaded_at else None,
                }
                for f in files
            ]
        }


@router.delete("/{subject_id}/files/{file_id}")
async def delete_file(subject_id: int, file_id: int):
    async with async_session_factory() as session:
        result = await session.execute(
            select(SubjectFileModel).where(SubjectFileModel.id == file_id, SubjectFileModel.subject_id == subject_id)
        )
        db_file = result.scalar_one_or_none()
        if not db_file:
            raise HTTPException(status_code=404, detail="File not found")
        if os.path.exists(db_file.file_path):
            os.remove(db_file.file_path)
        await session.delete(db_file)
        await session.commit()
        return {"success": True}


@router.get("/{subject_id}/files/{file_id}/download")
async def download_file(subject_id: int, file_id: int):
    async with async_session_factory() as session:
        result = await session.execute(
            select(SubjectFileModel).where(SubjectFileModel.id == file_id, SubjectFileModel.subject_id == subject_id)
        )
        db_file = result.scalar_one_or_none()
        if not db_file:
            raise HTTPException(status_code=404, detail="File not found")
        if not os.path.exists(db_file.file_path):
            raise HTTPException(status_code=404, detail="File not found on disk")
        return FileResponse(
            db_file.file_path,
            media_type=db_file.file_type or "application/octet-stream",
            filename=db_file.original_name,
        )
