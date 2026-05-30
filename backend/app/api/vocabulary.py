from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from datetime import datetime

from app.core.database import get_db, async_session_factory
from app.models.models import VocabularyWord, GameMatch
from app.schemas.schemas import VocabularyWordCreate, VocabularyWordRead, GameMatchCreate, GameMatchRead

router = APIRouter(prefix="/vocabulary", tags=["Vocabulary Ledger"])


@router.get("/", response_model=List[VocabularyWordRead])
async def list_vocabulary(db: AsyncSession = Depends(get_db)):
    """List all permanently saved vocabulary words for default user (ID = 1)."""
    user_id = 1
    result = await db.execute(
        select(VocabularyWord)
        .where(VocabularyWord.user_id == user_id)
        .order_by(VocabularyWord.word.asc())
    )
    return result.scalars().all()


@router.post("/", response_model=VocabularyWordRead)
async def add_vocabulary_word(word_in: VocabularyWordCreate, db: AsyncSession = Depends(get_db)):
    """Add a vocabulary word. If it exists, merge new meanings."""
    user_id = 1
    normalized = word_in.word.strip().lower()
    
    # Check if exists
    result = await db.execute(
        select(VocabularyWord)
        .where(VocabularyWord.user_id == user_id, VocabularyWord.word == normalized)
    )
    existing = result.scalar_one_or_none()
    
    if existing:
        # Merge meanings safely
        current_meanings = set(existing.meanings)
        for m in word_in.meanings:
            if m.strip():
                current_meanings.add(m.strip())
        existing.meanings = list(current_meanings)
        existing.updated_at = datetime.utcnow()
        await db.commit()
        await db.refresh(existing)
        return existing
    else:
        new_word = VocabularyWord(
            user_id=user_id,
            word=normalized,
            meanings=[m.strip() for m in word_in.meanings if m.strip()]
        )
        db.add(new_word)
        await db.commit()
        await db.refresh(new_word)
        return new_word


@router.post("/bulk")
async def bulk_add_vocabulary(words_in: List[VocabularyWordCreate], db: AsyncSession = Depends(get_db)):
    """Bulk sync vocabulary words from client matches."""
    user_id = 1
    added_count = 0
    updated_count = 0
    
    for item in words_in:
        normalized = item.word.strip().lower()
        if not normalized:
            continue
            
        result = await db.execute(
            select(VocabularyWord)
            .where(VocabularyWord.user_id == user_id, VocabularyWord.word == normalized)
        )
        existing = result.scalar_one_or_none()
        
        if existing:
            current_meanings = set(existing.meanings)
            for m in item.meanings:
                if m.strip():
                    current_meanings.add(m.strip())
            existing.meanings = list(current_meanings)
            existing.updated_at = datetime.utcnow()
            updated_count += 1
        else:
            new_word = VocabularyWord(
                user_id=user_id,
                word=normalized,
                meanings=[m.strip() for m in item.meanings if m.strip()]
            )
            db.add(new_word)
            added_count += 1
            
    await db.commit()
    return {"status": "success", "added": added_count, "updated": updated_count}


@router.post("/matches", response_model=GameMatchRead)
async def record_game_match(match_in: GameMatchCreate, db: AsyncSession = Depends(get_db)):
    """Record a completed game match history."""
    user_id = 1
    new_match = GameMatch(
        user_id=user_id,
        score=match_in.score,
        mode=match_in.mode,
        word_count=match_in.word_count,
        words_json=match_in.words_json
    )
    db.add(new_match)
    await db.commit()
    await db.refresh(new_match)
    return new_match


@router.get("/matches", response_model=List[GameMatchRead])
async def list_game_matches(db: AsyncSession = Depends(get_db), limit: int = 50):
    """List game match history."""
    user_id = 1
    result = await db.execute(
        select(GameMatch)
        .where(GameMatch.user_id == user_id)
        .order_by(GameMatch.created_at.desc())
        .limit(limit)
    )
    return result.scalars().all()
