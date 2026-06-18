from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime, Index, Float, Boolean, ForeignKey
from sqlalchemy import JSON
from sqlalchemy.orm import relationship
from pgvector.sqlalchemy import Vector
from sqlalchemy.ext.compiler import compiles
from app.core.database import Base
from app.core.config import settings

@compiles(JSON, "postgresql")
def compile_json_postgresql(type_, compiler, **kw):
    return "JSONB"

@compiles(Vector, "sqlite")
def compile_vector_sqlite(type_, compiler, **kw):
    return "TEXT"


def _utcnow():
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(150), unique=True, index=True, nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), default=_utcnow, server_default="now()")


class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, default=1)
    title = Column(String(300), nullable=False, index=True)
    description = Column(Text, nullable=True)
    category = Column(String(80), default="general", index=True)
    difficulty = Column(Integer, default=1)
    modules = Column(JSON, default=list)
    created_at = Column(DateTime(timezone=True), default=_utcnow, server_default="now()")
    updated_at = Column(DateTime(timezone=True), default=_utcnow, onupdate=_utcnow)

    progress_records = relationship(
        "Progress", back_populates="course", cascade="all, delete-orphan", lazy="selectin"
    )


class Progress(Base):
    __tablename__ = "progress"
    __table_args__ = (
        Index("ix_progress_course_module", "course_id", "module_id"),
    )

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    module_id = Column(String(100), nullable=False)
    completion_percentage = Column(Float, default=0.0)
    score = Column(Integer, default=0)
    is_completed = Column(Boolean, default=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    updated_at = Column(DateTime(timezone=True), default=_utcnow, onupdate=_utcnow)

    course = relationship("Course", back_populates="progress_records", lazy="selectin")


class CodeSnippet(Base):
    __tablename__ = "code_snippets"

    id = Column(Integer, primary_key=True, index=True)
    lab_id = Column(String(100), nullable=True, index=True)
    title = Column(String(300), nullable=False)
    code = Column(Text, nullable=False)
    language = Column(String(30), default="python")
    tags = Column(JSON, default=list)
    created_at = Column(DateTime(timezone=True), default=_utcnow, server_default="now()")
    updated_at = Column(DateTime(timezone=True), default=_utcnow, onupdate=_utcnow)


class KnowledgeDocument(Base):
    __tablename__ = "knowledge_documents"
    __table_args__ = (
        Index("ix_knowledge_doc_source", "source_file"),
        Index("ix_knowledge_doc_type", "doc_type"),
    )

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(500), nullable=False)
    source_file = Column(String(500), nullable=True)
    doc_type = Column(String(50), default="text")
    chunk_index = Column(Integer, nullable=False)
    content = Column(Text, nullable=False)
    embedding = Column(Vector(settings.embedding_dimension), nullable=True)
    metadata_ = Column("metadata", JSON, default=dict)
    created_at = Column(DateTime(timezone=True), default=_utcnow, server_default="now()")


class Subject(Base):
    __tablename__ = "subjects"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, default=1)
    name = Column(String(200), nullable=False)
    code = Column(String(50), nullable=True, index=True)
    instructor = Column(String(200), nullable=True)
    schedule_day = Column(String(20), nullable=True)
    schedule_time = Column(String(50), nullable=True)
    room = Column(String(100), nullable=True)
    color = Column(String(20), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=_utcnow, server_default="now()")
    updated_at = Column(DateTime(timezone=True), default=_utcnow, onupdate=_utcnow)

    files = relationship("SubjectFile", back_populates="subject", cascade="all, delete-orphan", lazy="selectin")


class SubjectFile(Base):
    __tablename__ = "subject_files"

    id = Column(Integer, primary_key=True, index=True)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    filename = Column(String(500), nullable=False)
    original_name = Column(String(500), nullable=False)
    file_type = Column(String(100), nullable=True)
    file_size = Column(Integer, default=0)
    file_path = Column(String(1000), nullable=False)
    uploaded_at = Column(DateTime(timezone=True), default=_utcnow, server_default="now()")

    subject = relationship("Subject", back_populates="files", lazy="selectin")


class Note(Base):
    __tablename__ = "notes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, default=1)
    title = Column(String(300), nullable=False)
    content = Column(Text, nullable=True)
    type = Column(String(20), default="text")
    audio_file_path = Column(String(1000), nullable=True)
    duration = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), default=_utcnow, server_default="now()")
    updated_at = Column(DateTime(timezone=True), default=_utcnow, onupdate=_utcnow)


class FlashcardDeck(Base):
    __tablename__ = "flashcard_decks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(300), nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=_utcnow, server_default="now()")
    updated_at = Column(DateTime(timezone=True), default=_utcnow, onupdate=_utcnow)

    cards = relationship("FlashcardCard", back_populates="deck", cascade="all, delete-orphan", lazy="selectin")


class FlashcardCard(Base):
    __tablename__ = "flashcard_cards"

    id = Column(Integer, primary_key=True, index=True)
    deck_id = Column(Integer, ForeignKey("flashcard_decks.id", ondelete="CASCADE"), nullable=False)
    front = Column(Text, nullable=False)
    back = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), default=_utcnow, server_default="now()")

    deck = relationship("FlashcardDeck", back_populates="cards")

    # SM-2 fields
    easiness_factor = Column(Float, default=2.5)
    interval = Column(Integer, default=0)
    repetitions = Column(Integer, default=0)
    next_review = Column(DateTime(timezone=True), default=_utcnow, server_default="now()")


class FlashcardReview(Base):
    __tablename__ = "flashcard_reviews"

    id = Column(Integer, primary_key=True, index=True)
    card_id = Column(Integer, ForeignKey("flashcard_cards.id", ondelete="CASCADE"), nullable=False)
    quality = Column(Integer, nullable=False)  # 0-5 (SM-2 scale)
    reviewed_at = Column(DateTime(timezone=True), default=_utcnow, server_default="now()")


class Challenge(Base):
    __tablename__ = "challenges"

    id = Column(Integer, primary_key=True, index=True)
    challenge_id = Column(String(50), unique=True, nullable=False, index=True)
    title = Column(String(300), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(80), default="general", index=True)
    difficulty = Column(String(20), default="easy")
    points = Column(Integer, default=100)
    is_active = Column(Boolean, default=True)
    word_list = Column(JSON, default=list)
    created_at = Column(DateTime(timezone=True), default=_utcnow, server_default="now()")


class Skill(Base):
    __tablename__ = "skills"

    id = Column(String(100), primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(100), index=True)
    
    states = relationship("SkillState", back_populates="skill", cascade="all, delete-orphan")


class SkillState(Base):
    __tablename__ = "skill_states"
    __table_args__ = (
        Index("ix_skill_state_user_skill", "user_id", "skill_id", unique=True),
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True)  # سنفترض وجود مستخدم (يمكن ربطه بموديل User لاحقاً)
    skill_id = Column(String(100), ForeignKey("skills.id", ondelete="CASCADE"), nullable=False)
    p_know = Column(Float, default=0.3)
    attempts = Column(Integer, default=0)
    correct = Column(Integer, default=0)
    last_practiced = Column(DateTime(timezone=True), default=_utcnow, onupdate=_utcnow)

    skill = relationship("Skill", back_populates="states")


class FocusSession(Base):
    __tablename__ = "focus_sessions"

    id = Column(Integer, primary_key=True, index=True)
    start_time = Column(DateTime(timezone=True), default=_utcnow, nullable=False)
    end_time = Column(DateTime(timezone=True), nullable=True)
    duration = Column(Integer, default=0)  # in seconds
    session_type = Column(String(20), default="focus")  # 'focus' or 'break'
    completed = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=_utcnow, server_default="now()")


class Goal(Base):
    __tablename__ = "goals"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, default=1)
    title = Column(String(300), nullable=False)
    description = Column(Text, nullable=True)
    target = Column(Integer, default=1)
    current = Column(Integer, default=0)
    target_type = Column(String(50), default="hours")  # 'hours', 'courses', 'quizzes'
    deadline = Column(DateTime(timezone=True), nullable=True)
    completed = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=_utcnow, server_default="now()")
    updated_at = Column(DateTime(timezone=True), default=_utcnow, onupdate=_utcnow)


class ScheduleCourse(Base):
    __tablename__ = "schedule_courses"

    id = Column(String(100), primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, default=1)
    name = Column(String(300), nullable=False)
    code = Column(String(100), nullable=True)
    time = Column(String(100), nullable=False)
    day = Column(String(100), nullable=False)
    room = Column(String(100), nullable=True)
    instructor = Column(String(300), nullable=True)
    is_template = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=_utcnow, server_default="now()")
    updated_at = Column(DateTime(timezone=True), default=_utcnow, onupdate=_utcnow)


class VocabularyWord(Base):
    __tablename__ = "vocabulary_words"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, default=1)
    word = Column(String(100), nullable=False, index=True)
    meanings = Column(JSON, nullable=False, default=list)
    created_at = Column(DateTime(timezone=True), default=_utcnow, server_default="now()")
    updated_at = Column(DateTime(timezone=True), default=_utcnow, onupdate=_utcnow)


class GameMatch(Base):
    __tablename__ = "game_matches"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, default=1)
    score = Column(Integer, nullable=False, default=0)
    mode = Column(String(50), nullable=False, default="classic")
    word_count = Column(Integer, nullable=False, default=0)
    words_json = Column(JSON, nullable=False, default=list)
    created_at = Column(DateTime(timezone=True), default=_utcnow, server_default="now()")


class AIChatMessage(Base):
    __tablename__ = "ai_chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, default=1)
    agent_id = Column(String(100), nullable=False, index=True)
    role = Column(String(50), nullable=False)
    content = Column(Text, nullable=False)
    display_content = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=_utcnow, server_default="now()")


class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, default=1)
    agent_id = Column(String(100), nullable=False, default="general", index=True)
    title = Column(String(300), nullable=False, default="محادثة جديدة")
    created_at = Column(DateTime(timezone=True), default=_utcnow, server_default="now()")
    updated_at = Column(DateTime(timezone=True), default=_utcnow, onupdate=_utcnow, server_default="now()")

    messages = relationship(
        "ChatMessage", back_populates="session", cascade="all, delete-orphan", lazy="selectin"
    )


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("chat_sessions.id", ondelete="CASCADE"), nullable=False)
    role = Column(String(50), nullable=False)
    content = Column(Text, nullable=False)
    display_content = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=_utcnow, server_default="now()")

    session = relationship("ChatSession", back_populates="messages")


