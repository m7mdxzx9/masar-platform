from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime, Index, Float, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from pgvector.sqlalchemy import Vector
from app.core.database import Base
from app.core.config import settings


def _utcnow():
    return datetime.now(timezone.utc)


class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(300), nullable=False, index=True)
    description = Column(Text, nullable=True)
    category = Column(String(80), default="general", index=True)
    difficulty = Column(Integer, default=1)
    modules = Column(JSONB, default=list)
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
    tags = Column(JSONB, default=list)
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
    metadata_ = Column("metadata", JSONB, default=dict)
    created_at = Column(DateTime(timezone=True), default=_utcnow, server_default="now()")


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
    word_list = Column(JSONB, default=list)
    created_at = Column(DateTime(timezone=True), default=_utcnow, server_default="now()")
