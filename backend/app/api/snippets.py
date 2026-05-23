from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.models import CodeSnippet

router = APIRouter(prefix="/snippets", tags=["snippets"])


class SnippetCreate(BaseModel):
    title: str = Field(..., max_length=300)
    code: str = Field(..., min_length=1)
    language: str = Field(default="python", max_length=30)
    lab_id: Optional[str] = None


class SnippetRead(BaseModel):
    id: int
    lab_id: Optional[str]
    title: str
    code: str
    language: str
    tags: List[str]
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

    model_config = {"from_attributes": True}


class SnippetUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=300)
    code: Optional[str] = None
    language: Optional[str] = Field(None, max_length=30)


@router.post("", response_model=SnippetRead)
async def create_snippet(snippet_in: SnippetCreate, db: AsyncSession = Depends(get_db)):
    snip = CodeSnippet(**snippet_in.model_dump())
    db.add(snip)
    await db.flush()
    await db.refresh(snip)
    return snip


@router.get("", response_model=List[SnippetRead])
async def list_snippets(
    language: Optional[str] = None,
    search: Optional[str] = Query(None),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(CodeSnippet).offset(skip).limit(limit).order_by(CodeSnippet.updated_at.desc())
    if language:
        stmt = stmt.where(CodeSnippet.language == language)
    if search:
        stmt = stmt.where(
            CodeSnippet.title.ilike(f"%{search}%")
            | CodeSnippet.code.ilike(f"%{search}%")
        )
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/{snippet_id}", response_model=SnippetRead)
async def get_snippet(snippet_id: int, db: AsyncSession = Depends(get_db)):
    stmt = select(CodeSnippet).where(CodeSnippet.id == snippet_id)
    result = await db.execute(stmt)
    snip = result.scalars().first()
    if not snip:
        raise HTTPException(status_code=404, detail="Snippet not found")
    return snip


@router.put("/{snippet_id}", response_model=SnippetRead)
async def update_snippet(snippet_id: int, snippet_in: SnippetUpdate, db: AsyncSession = Depends(get_db)):
    stmt = select(CodeSnippet).where(CodeSnippet.id == snippet_id)
    result = await db.execute(stmt)
    snip = result.scalars().first()
    if not snip:
        raise HTTPException(status_code=404, detail="Snippet not found")
    update_data = {k: v for k, v in snippet_in.model_dump().items() if v is not None}
    for key, value in update_data.items():
        setattr(snip, key, value)
    await db.flush()
    await db.refresh(snip)
    return snip


@router.delete("/{snippet_id}")
async def delete_snippet(snippet_id: int, db: AsyncSession = Depends(get_db)):
    stmt = select(CodeSnippet).where(CodeSnippet.id == snippet_id)
    result = await db.execute(stmt)
    snip = result.scalars().first()
    if not snip:
        raise HTTPException(status_code=404, detail="Snippet not found")
    await db.delete(snip)
    await db.flush()
    return {"success": True}
