from pydantic import BaseModel, Field
from typing import Optional, List, Any
from datetime import datetime


class CourseCreate(BaseModel):
    title: str = Field(..., max_length=300)
    description: Optional[str] = None
    category: str = Field(default="general", max_length=80)
    difficulty: int = Field(default=1, ge=1, le=5)
    modules: List[Any] = Field(default_factory=list)


class CourseRead(BaseModel):
    id: int
    title: str
    description: Optional[str]
    category: str
    difficulty: int
    modules: List[Any]
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class ProgressCreate(BaseModel):
    course_id: int
    module_id: str
    completion_percentage: float = Field(default=0.0, ge=0.0, le=100.0)
    score: int = Field(default=0, ge=0)


class ProgressRead(BaseModel):
    id: int
    course_id: int
    module_id: str
    completion_percentage: float
    score: int
    is_completed: bool
    completed_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class CodeSnippetCreate(BaseModel):
    lab_id: Optional[str] = None
    title: str = Field(..., max_length=300)
    code: str
    language: str = Field(default="python", max_length=30)
    tags: List[str] = Field(default_factory=list)


class CodeSnippetRead(BaseModel):
    id: int
    lab_id: Optional[str]
    title: str
    code: str
    language: str
    tags: List[Any]
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class ChallengeCreate(BaseModel):
    challenge_id: str = Field(..., max_length=50)
    title: str = Field(..., max_length=300)
    description: Optional[str] = None
    category: str = Field(default="general", max_length=80)
    difficulty: str = Field(default="easy", pattern="^(easy|medium|hard)$")
    points: int = Field(default=100, ge=0)
    is_active: bool = True
    word_list: List[Any] = Field(default_factory=list)


class ChallengeRead(BaseModel):
    id: int
    challenge_id: str
    title: str
    description: Optional[str]
    category: str
    difficulty: str
    points: int
    is_active: bool
    word_list: List[Any]

    model_config = {"from_attributes": True}


class ScoreSubmission(BaseModel):
    challenge_id: str
    score: int = Field(..., ge=0)
    streak_bonus: int = Field(default=0, ge=0)


class LabProgressCreate(BaseModel):
    lab_id: str = Field(..., max_length=100)
    course_id: int
    code: str
    language: str = Field(default="python", max_length=30)
    output: Optional[str] = None
    is_passed: bool = False
    score: int = Field(default=0, ge=0)


class LabProgressRead(BaseModel):
    id: int
    lab_id: str
    course_id: int
    code: str
    language: str
    output: Optional[str]
    is_passed: bool
    score: int
    submitted_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class KnowledgeDocumentRead(BaseModel):
    id: int
    title: str
    source_file: Optional[str]
    doc_type: str
    chunk_index: int
    content: str
    metadata_: Optional[dict] = None
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}
