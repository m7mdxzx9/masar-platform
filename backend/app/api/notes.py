import os
import uuid
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Query
from fastapi.responses import FileResponse, RedirectResponse
from pydantic import BaseModel, Field
from typing import Optional
from sqlalchemy import select, or_
from app.core.database import async_session_factory
from app.models.models import Note as NoteModel
from app.services.storage_service import storage_service

router = APIRouter(prefix="/notes", tags=["notes"])

UPLOAD_BASE = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads", "notes")


class NoteCreate(BaseModel):
    title: str = Field(..., min_length=1)
    content: Optional[str] = None
    type: str = Field(default="text")


class NoteUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None


@router.get("/")
async def list_notes(search: str = Query(default="", max_length=200)):
    async with async_session_factory() as session:
        query = select(NoteModel).order_by(NoteModel.created_at.desc())
        if search:
            query = query.where(
                or_(NoteModel.title.ilike(f"%{search}%"), NoteModel.content.ilike(f"%{search}%"))
            )
        result = await session.execute(query)
        notes = result.scalars().all()
        return {
            "notes": [
                {
                    "id": n.id,
                    "title": n.title,
                    "content": n.content,
                    "type": n.type,
                    "audio_file_path": n.audio_file_path,
                    "duration": n.duration,
                    "created_at": n.created_at.isoformat() if n.created_at else None,
                    "updated_at": n.updated_at.isoformat() if n.updated_at else None,
                }
                for n in notes
            ]
        }


@router.get("/{note_id}")
async def get_note(note_id: int):
    async with async_session_factory() as session:
        result = await session.execute(select(NoteModel).where(NoteModel.id == note_id))
        note = result.scalar_one_or_none()
        if not note:
            raise HTTPException(status_code=404, detail="Note not found")
        return {
            "id": note.id,
            "title": note.title,
            "content": note.content,
            "type": note.type,
            "audio_file_path": note.audio_file_path,
            "duration": note.duration,
            "created_at": note.created_at.isoformat() if note.created_at else None,
            "updated_at": note.updated_at.isoformat() if note.updated_at else None,
        }


@router.post("/")
async def create_note(data: NoteCreate):
    async with async_session_factory() as session:
        note = NoteModel(
            title=data.title,
            content=data.content,
            type=data.type,
        )
        session.add(note)
        await session.commit()
        await session.refresh(note)
        return {
            "id": note.id,
            "title": note.title,
            "content": note.content,
            "type": note.type,
            "created_at": note.created_at.isoformat() if note.created_at else None,
        }


@router.put("/{note_id}")
async def update_note(note_id: int, data: NoteUpdate):
    async with async_session_factory() as session:
        result = await session.execute(select(NoteModel).where(NoteModel.id == note_id))
        note = result.scalar_one_or_none()
        if not note:
            raise HTTPException(status_code=404, detail="Note not found")
        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(note, key, value)
        await session.commit()
        await session.refresh(note)
        return {
            "id": note.id,
            "title": note.title,
            "content": note.content,
            "type": note.type,
            "updated_at": note.updated_at.isoformat() if note.updated_at else None,
        }


@router.delete("/{note_id}")
async def delete_note(note_id: int):
    async with async_session_factory() as session:
        result = await session.execute(select(NoteModel).where(NoteModel.id == note_id))
        note = result.scalar_one_or_none()
        if not note:
            raise HTTPException(status_code=404, detail="Note not found")
        if note.audio_file_path:
            if note.audio_file_path.startswith("http"):
                storage_service.delete_file(note.audio_file_path)
            elif os.path.exists(note.audio_file_path):
                os.remove(note.audio_file_path)
        await session.delete(note)
        await session.commit()
        return {"success": True}


@router.post("/voice")
async def upload_voice_note(
    title: str = Form(...),
    file: UploadFile = File(...),
    duration: float = Form(default=0.0),
):
    os.makedirs(UPLOAD_BASE, exist_ok=True)
    ext = os.path.splitext(file.filename or "audio")[1]
    if not ext:
        ext = ".webm"
    unique_name = f"{uuid.uuid4().hex}{ext}"
    file_path = os.path.join(UPLOAD_BASE, unique_name)

    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)

    # Upload to Cloud Storage if enabled
    if storage_service.is_enabled:
        remote_path = f"notes/voice/{unique_name}"
        cloud_url = storage_service.upload_file(
            local_path=file_path,
            remote_path=remote_path,
            content_type=file.content_type or "audio/webm"
        )
        if cloud_url:
            try:
                os.remove(file_path)
            except Exception:
                pass
            file_path = cloud_url

    async with async_session_factory() as session:
        note = NoteModel(
            title=title,
            content="",
            type="voice",
            audio_file_path=file_path,
            duration=duration if duration > 0 else None,
        )
        session.add(note)
        await session.commit()
        await session.refresh(note)
        return {
            "id": note.id,
            "title": note.title,
            "type": note.type,
            "duration": note.duration,
            "created_at": note.created_at.isoformat() if note.created_at else None,
        }


@router.get("/audio/{note_id}")
async def get_audio(note_id: int):
    async with async_session_factory() as session:
        result = await session.execute(select(NoteModel).where(NoteModel.id == note_id))
        note = result.scalar_one_or_none()
        if not note or not note.audio_file_path:
            raise HTTPException(status_code=404, detail="Audio not found")
        if note.audio_file_path.startswith("gdrive://"):
            drive_file_id = note.audio_file_path.replace("gdrive://", "")
            return RedirectResponse(url=f"/api/v1/drive/download/{drive_file_id}")
        if note.audio_file_path.startswith("http"):
            return RedirectResponse(url=note.audio_file_path)
        if not os.path.exists(note.audio_file_path):
            raise HTTPException(status_code=404, detail="Audio file not found on disk")
        return FileResponse(note.audio_file_path, media_type="audio/webm")
