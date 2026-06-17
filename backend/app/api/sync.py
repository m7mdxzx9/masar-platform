from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from sqlalchemy import select, delete, text
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.auth import get_current_user_id
import json
import logging
import os

from app.core.database import get_db, async_session_factory
from app.models.models import Subject as SubjectModel, Note as NoteModel, Course as CourseModel, ScheduleCourse as ScheduleCourseModel, VocabularyWord as VocabularyWordModel


logger = logging.getLogger(__name__)
router = APIRouter(prefix="/sync", tags=["State Sync"])

# --- schemas ---

class SubjectSyncItem(BaseModel):
    id: int
    name: str
    code: Optional[str] = None
    instructor: Optional[str] = None
    schedule_day: Optional[str] = None
    schedule_time: Optional[str] = None
    room: Optional[str] = None
    color: Optional[str] = None
    notes: Optional[str] = None
    updated_at: Optional[datetime] = None

class NoteSyncItem(BaseModel):
    id: int
    title: str
    content: Optional[str] = None
    type: str = "text"
    audio_file_path: Optional[str] = None
    duration: Optional[float] = None
    updated_at: Optional[datetime] = None

class CourseSyncItem(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    category: str = "general"
    difficulty: int = 1
    modules: List[dict] = []
    updated_at: Optional[datetime] = None

class ScheduleCourseSyncItem(BaseModel):
    id: str
    name: str
    code: Optional[str] = None
    time: str
    day: str
    room: Optional[str] = None
    instructor: Optional[str] = None
    is_template: bool = False
    updated_at: Optional[datetime] = None

class VocabularySyncItem(BaseModel):
    id: int
    word: str
    meanings: List[str] = []
    updated_at: Optional[datetime] = None

class SyncPushRequest(BaseModel):
    subjects: List[SubjectSyncItem] = []
    notes: List[NoteSyncItem] = []
    courses: List[CourseSyncItem] = []
    schedule_courses: List[ScheduleCourseSyncItem] = []
    vocabulary: List[VocabularySyncItem] = []
    deleted_subjects: List[int] = []
    deleted_notes: List[int] = []
    deleted_courses: List[int] = []
    deleted_schedule_courses: List[str] = []
    lab_code: Optional[str] = None

class SyncPullResponse(BaseModel):
    subjects: List[SubjectSyncItem] = []
    notes: List[NoteSyncItem] = []
    courses: List[CourseSyncItem] = []
    schedule_courses: List[ScheduleCourseSyncItem] = []
    vocabulary: List[VocabularySyncItem] = []
    lab_code: Optional[str] = None


# --- WebSocket Connection Manager ---

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"New sync WebSocket connection. Total active: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(f"Sync WebSocket disconnected. Total active: {len(self.active_connections)}")

    async def broadcast(self, message: dict):
        dead_connections = []
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.warning(f"Failed to send message to connection: {e}")
                dead_connections.append(connection)
        
        for dead in dead_connections:
            self.disconnect(dead)

manager = ConnectionManager()

# --- REST Endpoints ---

@router.get("/pull", response_model=SyncPullResponse)
async def pull_sync(db: AsyncSession = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    """Pull all active states for the authenticated user."""
    
    # 1. Fetch Subjects
    sub_res = await db.execute(select(SubjectModel).where(SubjectModel.user_id == user_id))
    subjects = sub_res.scalars().all()
    
    # 2. Fetch Notes
    notes_res = await db.execute(select(NoteModel).where(NoteModel.user_id == user_id))
    notes = notes_res.scalars().all()
    
    # 3. Fetch Courses (Tracks)
    courses_res = await db.execute(select(CourseModel).where(CourseModel.user_id == user_id))
    courses = courses_res.scalars().all()
    
    # 4. Fetch Placed Grid Courses
    sched_res = await db.execute(select(ScheduleCourseModel).where(ScheduleCourseModel.user_id == user_id))
    schedule_courses = sched_res.scalars().all()
    
    # 5. Fetch Vocabulary Ledger
    vocab_res = await db.execute(select(VocabularyWordModel).where(VocabularyWordModel.user_id == user_id))
    vocabulary = vocab_res.scalars().all()
    
    active_code_path = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
        "uploads",
        "active_lab_code.py"
    )
    lab_code = None
    if os.path.exists(active_code_path):
        try:
            with open(active_code_path, "r", encoding="utf-8") as f:
                lab_code = f.read()
        except Exception as e:
            logger.error(f"Failed to read active lab code: {e}")

    return SyncPullResponse(
        subjects=[
            SubjectSyncItem(
                id=s.id, name=s.name, code=s.code, instructor=s.instructor,
                schedule_day=s.schedule_day, schedule_time=s.schedule_time,
                room=s.room, color=s.color, notes=s.notes, updated_at=s.updated_at
            ) for s in subjects
        ],
        notes=[
            NoteSyncItem(
                id=n.id, title=n.title, content=n.content, type=n.type,
                audio_file_path=n.audio_file_path, duration=n.duration, updated_at=n.updated_at
            ) for n in notes
        ],
        courses=[
            CourseSyncItem(
                id=c.id, title=c.title, description=c.description, category=c.category,
                difficulty=c.difficulty, modules=c.modules or [], updated_at=c.updated_at
            ) for c in courses
        ],
        schedule_courses=[
            ScheduleCourseSyncItem(
                id=sc.id, name=sc.name, code=sc.code, time=sc.time, day=sc.day,
                room=sc.room, instructor=sc.instructor, is_template=sc.is_template, updated_at=sc.updated_at
            ) for sc in schedule_courses
        ],
        vocabulary=[
            VocabularySyncItem(
                id=v.id, word=v.word, meanings=v.meanings or [], updated_at=v.updated_at
            ) for v in vocabulary
        ],
        lab_code=lab_code
    )


@router.post("/push")
async def push_sync(request: SyncPushRequest, db: AsyncSession = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    """Push local state changes and merge them (conflict resolution: latest wins)."""
    
    # 1. Merge Subjects
    for sub in request.subjects:
        db_sub_res = await db.execute(select(SubjectModel).where(SubjectModel.id == sub.id))
        db_sub = db_sub_res.scalar_one_or_none()
        if db_sub:
            if not db_sub.updated_at or (sub.updated_at and sub.updated_at > db_sub.updated_at):
                # Update existing
                db_sub.name = sub.name
                db_sub.code = sub.code
                db_sub.instructor = sub.instructor
                db_sub.schedule_day = sub.schedule_day
                db_sub.schedule_time = sub.schedule_time
                db_sub.room = sub.room
                db_sub.color = sub.color
                db_sub.notes = sub.notes
                if sub.updated_at:
                    db_sub.updated_at = sub.updated_at
        else:
            # Create new (avoid ID auto-increment conflicts by inserting directly or letting DB handle it)
            new_sub = SubjectModel(
                id=sub.id,
                user_id=user_id,
                name=sub.name,
                code=sub.code,
                instructor=sub.instructor,
                schedule_day=sub.schedule_day,
                schedule_time=sub.schedule_time,
                room=sub.room,
                color=sub.color,
                notes=sub.notes
            )
            if sub.updated_at:
                new_sub.updated_at = sub.updated_at
            db.add(new_sub)
            
    # 2. Merge Notes
    for note in request.notes:
        db_note_res = await db.execute(select(NoteModel).where(NoteModel.id == note.id))
        db_note = db_note_res.scalar_one_or_none()
        if db_note:
            if not db_note.updated_at or (note.updated_at and note.updated_at > db_note.updated_at):
                db_note.title = note.title
                db_note.content = note.content
                db_note.type = note.type
                db_note.audio_file_path = note.audio_file_path
                db_note.duration = note.duration
                if note.updated_at:
                    db_note.updated_at = note.updated_at
        else:
            new_note = NoteModel(
                id=note.id,
                user_id=user_id,
                title=note.title,
                content=note.content,
                type=note.type,
                audio_file_path=note.audio_file_path,
                duration=note.duration
            )
            if note.updated_at:
                new_note.updated_at = note.updated_at
            db.add(new_note)

    # 3. Merge Courses
    for course in request.courses:
        db_course_res = await db.execute(select(CourseModel).where(CourseModel.id == course.id))
        db_course = db_course_res.scalar_one_or_none()
        if db_course:
            if not db_course.updated_at or (course.updated_at and course.updated_at > db_course.updated_at):
                db_course.title = course.title
                db_course.description = course.description
                db_course.category = course.category
                db_course.difficulty = course.difficulty
                db_course.modules = course.modules
                if course.updated_at:
                    db_course.updated_at = course.updated_at
        else:
            new_course = CourseModel(
                id=course.id,
                user_id=user_id,
                title=course.title,
                description=course.description,
                category=course.category,
                difficulty=course.difficulty,
                modules=course.modules
            )
            if course.updated_at:
                new_course.updated_at = course.updated_at
            db.add(new_course)

    # 4. Merge Schedule Courses
    for sc in request.schedule_courses:
        db_sc_res = await db.execute(select(ScheduleCourseModel).where(ScheduleCourseModel.id == sc.id))
        db_sc = db_sc_res.scalar_one_or_none()
        if db_sc:
            if not db_sc.updated_at or (sc.updated_at and sc.updated_at > db_sc.updated_at):
                db_sc.name = sc.name
                db_sc.code = sc.code
                db_sc.time = sc.time
                db_sc.day = sc.day
                db_sc.room = sc.room
                db_sc.instructor = sc.instructor
                db_sc.is_template = sc.is_template
                if sc.updated_at:
                    db_sc.updated_at = sc.updated_at
        else:
            new_sc = ScheduleCourseModel(
                id=sc.id,
                user_id=user_id,
                name=sc.name,
                code=sc.code,
                time=sc.time,
                day=sc.day,
                room=sc.room,
                instructor=sc.instructor,
                is_template=sc.is_template
            )
            if sc.updated_at:
                new_sc.updated_at = sc.updated_at
            db.add(new_sc)

    # 5. Merge Vocabulary Ledger
    for vocab in request.vocabulary:
        normalized = vocab.word.strip().lower()
        if not normalized:
            continue
        db_vocab_res = await db.execute(
            select(VocabularyWordModel)
            .where(VocabularyWordModel.user_id == user_id, VocabularyWordModel.word == normalized)
        )
        db_vocab = db_vocab_res.scalar_one_or_none()
        if db_vocab:
            if not db_vocab.updated_at or (vocab.updated_at and vocab.updated_at > db_vocab.updated_at):
                merged_meanings = set(db_vocab.meanings or [])
                for m in vocab.meanings:
                    if m.strip():
                        merged_meanings.add(m.strip())
                db_vocab.meanings = list(merged_meanings)
                if vocab.updated_at:
                    db_vocab.updated_at = vocab.updated_at
        else:
            new_vocab = VocabularyWordModel(
                user_id=user_id,
                word=normalized,
                meanings=[m.strip() for m in vocab.meanings if m.strip()]
            )
            if vocab.updated_at:
                new_vocab.updated_at = vocab.updated_at
            db.add(new_vocab)

    # 6. Execute Deletions
    if request.deleted_subjects:
        await db.execute(
            delete(SubjectModel).where(
                SubjectModel.user_id == user_id,
                SubjectModel.id.in_(request.deleted_subjects)
            )
        )
    if request.deleted_notes:
        await db.execute(
            delete(NoteModel).where(
                NoteModel.user_id == user_id,
                NoteModel.id.in_(request.deleted_notes)
            )
        )
    if request.deleted_courses:
        await db.execute(
            delete(CourseModel).where(
                CourseModel.user_id == user_id,
                CourseModel.id.in_(request.deleted_courses)
            )
        )
    if request.deleted_schedule_courses:
        await db.execute(
            delete(ScheduleCourseModel).where(
                ScheduleCourseModel.user_id == user_id,
                ScheduleCourseModel.id.in_(request.deleted_schedule_courses)
            )
        )

    await db.commit()

    # Reset Postgres primary key sequences to prevent UniqueViolation error on subsequent manual inserts
    try:
        await db.execute(text("SELECT setval('subjects_id_seq', coalesce((SELECT MAX(id) FROM subjects), 1), true)"))
        await db.execute(text("SELECT setval('notes_id_seq', coalesce((SELECT MAX(id) FROM notes), 1), true)"))
        await db.execute(text("SELECT setval('courses_id_seq', coalesce((SELECT MAX(id) FROM courses), 1), true)"))
        await db.commit()
    except Exception as seq_err:
        logger.warning(f"Could not reset database sequences: {seq_err}")

    if request.lab_code is not None:
        active_code_path = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
            "uploads",
            "active_lab_code.py"
        )
        os.makedirs(os.path.dirname(active_code_path), exist_ok=True)
        try:
            with open(active_code_path, "w", encoding="utf-8") as f:
                f.write(request.lab_code)
        except Exception as e:
            logger.error(f"Failed to write active lab code: {e}")


    # Trigger a real-time WebSocket broadcast to let other clients pull
    await manager.broadcast({"type": "SYNC_TRIGGER", "sender": "api"})
    return {"status": "success", "message": "State merged successfully"}

# --- WebSocket Endpoint ---

@router.websocket("/ws")
async def sync_websocket(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Wait for messages from this client (e.g. notifications of local updates)
            data = await websocket.receive_text()
            logger.info(f"WebSocket received data: {data}")
            try:
                msg = json.loads(data)
                # Broadcast the update message to all other connections
                await manager.broadcast(msg)
            except json.JSONDecodeError:
                pass
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket)
