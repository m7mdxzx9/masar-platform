from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime, timezone
from sqlalchemy import select
from app.core.database import async_session_factory
from app.models.models import FlashcardDeck as DeckModel, FlashcardCard as CardModel, FlashcardReview as ReviewModel

router = APIRouter(prefix="/flashcards", tags=["flashcards"])


class DeckCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=300)
    description: Optional[str] = None


class CardCreate(BaseModel):
    front: str = Field(..., min_length=1)
    back: str = Field(..., min_length=1)


class ReviewRequest(BaseModel):
    quality: int = Field(..., ge=0, le=5, description="SM-2 quality: 0=blackout, 1=wrong, 2=hard, 3=medium, 4=easy, 5=perfect")


def _sm2(quality: int, easiness_factor: float, interval: int, repetitions: int):
    if quality < 3:
        repetitions = 0
        interval = 1
    else:
        if repetitions == 0:
            interval = 1
        elif repetitions == 1:
            interval = 6
        else:
            interval = round(interval * easiness_factor)
        repetitions += 1
    ef = easiness_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    if ef < 1.3:
        ef = 1.3
    return ef, interval, repetitions


@router.get("/decks")
async def list_decks():
    async with async_session_factory() as session:
        result = await session.execute(select(DeckModel).order_by(DeckModel.updated_at.desc()))
        decks = result.scalars().all()
        return {
            "decks": [
                {
                    "id": d.id,
                    "title": d.title,
                    "description": d.description,
                    "card_count": len(d.cards),
                    "due_count": sum(1 for c in d.cards if c.next_review and c.next_review.replace(tzinfo=None) <= datetime.now(timezone.utc).replace(tzinfo=None)),
                    "created_at": d.created_at.isoformat() if d.created_at else None,
                }
                for d in decks
            ]
        }


@router.post("/decks")
async def create_deck(req: DeckCreate):
    async with async_session_factory() as session:
        deck = DeckModel(title=req.title, description=req.description)
        session.add(deck)
        await session.commit()
        await session.refresh(deck)
        return {"id": deck.id, "title": deck.title, "description": deck.description, "card_count": 0, "due_count": 0}


@router.delete("/decks/{deck_id}")
async def delete_deck(deck_id: int):
    async with async_session_factory() as session:
        result = await session.execute(select(DeckModel).where(DeckModel.id == deck_id))
        deck = result.scalar_one_or_none()
        if not deck:
            raise HTTPException(status_code=404, detail="Deck not found")
        await session.delete(deck)
        await session.commit()
        return {"success": True}


@router.get("/decks/{deck_id}/cards")
async def list_cards(deck_id: int):
    async with async_session_factory() as session:
        result = await session.execute(select(DeckModel).where(DeckModel.id == deck_id))
        deck = result.scalar_one_or_none()
        if not deck:
            raise HTTPException(status_code=404, detail="Deck not found")
        now = datetime.now(timezone.utc)
        return {
            "cards": [
                {
                    "id": c.id,
                    "front": c.front,
                    "back": c.back,
                    "easiness_factor": c.easiness_factor,
                    "interval": c.interval,
                    "repetitions": c.repetitions,
                    "next_review": c.next_review.isoformat() if c.next_review else None,
                    "is_due": c.next_review is not None and c.next_review <= now,
                }
                for c in deck.cards
            ]
        }


@router.post("/decks/{deck_id}/cards")
async def create_card(deck_id: int, req: CardCreate):
    async with async_session_factory() as session:
        result = await session.execute(select(DeckModel).where(DeckModel.id == deck_id))
        deck = result.scalar_one_or_none()
        if not deck:
            raise HTTPException(status_code=404, detail="Deck not found")
        card = CardModel(deck_id=deck_id, front=req.front, back=req.back)
        session.add(card)
        await session.commit()
        await session.refresh(card)
        return {"id": card.id, "front": card.front, "back": card.back}


@router.post("/cards/{card_id}/review")
async def review_card(card_id: int, req: ReviewRequest):
    async with async_session_factory() as session:
        result = await session.execute(select(CardModel).where(CardModel.id == card_id))
        card = result.scalar_one_or_none()
        if not card:
            raise HTTPException(status_code=404, detail="Card not found")
        ef, interval, reps = _sm2(req.quality, card.easiness_factor, card.interval, card.repetitions)
        from datetime import timedelta
        card.easiness_factor = ef
        card.interval = interval
        card.repetitions = reps
        card.next_review = datetime.now(timezone.utc) + timedelta(days=interval)
        review = ReviewModel(card_id=card_id, quality=req.quality)
        session.add(review)
        await session.commit()
        return {
            "easiness_factor": ef,
            "interval": interval,
            "repetitions": reps,
            "next_review": card.next_review.isoformat(),
        }
