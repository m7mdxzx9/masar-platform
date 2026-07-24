from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Literal, List
import logging
import json

from app.services.agents.llm_factory import create_chat_llm_with_fallback

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/english", tags=["English Learning"])


class GenerateSentenceRequest(BaseModel):
    word: str
    level: str = "a1"


class GenerateSentenceResponse(BaseModel):
    sentence: str
    translation: str


class NewsItem(BaseModel):
    id: int
    title: str
    type: Literal["news", "novel"]
    summary: str
    level: str


class NewsContentRequest(BaseModel):
    id: int
    title: str
    type: Literal["news", "novel"]
    level: str


class NewsContentResponse(BaseModel):
    text: str
    level: str
    arabic_title: str
    vocabulary: List[dict]  # list of {"word": "...", "translation": "..."}


@router.post("/generate-sentence", response_model=GenerateSentenceResponse)
async def generate_sentence(request: GenerateSentenceRequest):
    try:
        llm = create_chat_llm_with_fallback(temperature=0.7, max_tokens=150)
        prompt = (
            f"You are an English language tutor. Generate a short, natural English sentence (max 15 words) "
            f"suitable for a student at '{request.level.upper()}' level that contains the word '{request.word}'. "
            f"Output format exactly as: English sentence | Arabic translation. "
            f"For example: 'I use the computer to write code. | أنا أستخدم الحاسوب لكتابة الكود.' "
            f"Do not include any other text, numbers, or explanation."
        )
        response = await llm.ainvoke([
            {"role": "user", "content": prompt}
        ])
        content = response.content.strip()
        if "|" in content:
            eng, ara = content.split("|", 1)
            return GenerateSentenceResponse(sentence=eng.strip(), translation=ara.strip())
        else:
            return GenerateSentenceResponse(sentence=content, translation="ترجمة غير متوفرة")
    except Exception as e:
        logger.error(f"Error generating sentence: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/news", response_model=List[NewsItem])
async def get_news_list(refresh: bool = False):
    try:
        llm = create_chat_llm_with_fallback(temperature=0.9, max_tokens=1000)
        prompt = (
            "Generate exactly 8 fresh and engaging reading items for an English language learner. "
            "Mix technology news, sci-fi, programming tips, and daily life stories. "
            "Format exactly as JSON array of objects with keys: "
            "'id' (1-8), 'title' (short, catchy), 'type' (either 'news' or 'novel'), 'summary' (max 15 words), "
            "and 'level' (one of: 'a1', 'a2', 'b1', 'b2', 'c1', 'c2'). "
            "Ensure a mix of all levels. Return ONLY the JSON array without formatting."
        )
        response = await llm.ainvoke([{"role": "user", "content": prompt}])
        raw = response.content.strip()
        
        if raw.startswith("```"):
            if "\n" in raw:
                raw = raw.split("\n", 1)[1]
            else:
                raw = raw.replace("```json", "").replace("```", "")
        if raw.endswith("```"):
            raw = raw.rsplit("```", 1)[0]
        
        parsed = json.loads(raw.strip())
        items = []
        for p in parsed[:8]:
            items.append(NewsItem(
                id=p.get("id", 1),
                title=p.get("title", "Fresh Story"),
                type=p.get("type", "news") if p.get("type") in ["news", "novel"] else "news",
                summary=p.get("summary", "A great story to practice English."),
                level=p.get("level", "b1").lower()
            ))
        return items
    except Exception as e:
        logger.error(f"Error generating dynamic news: {e}", exc_info=True)
        # Fallback to static list if AI generation fails
        return [
            NewsItem(id=1, title="AI Agents: The Next Frontier", type="news", summary="How AI is transforming software engineering.", level="b2"),
            NewsItem(id=2, title="The Missing Semicolon", type="novel", summary="A programmer's thriller story set in a tech startup.", level="a2"),
            NewsItem(id=3, title="Understanding Quantum Computing", type="news", summary="A simple introduction to qubits.", level="c1"),
            NewsItem(id=4, title="The Code of Silence", type="novel", summary="A mystery story about a hacker.", level="b1"),
            NewsItem(id=5, title="Modern Web Development", type="news", summary="Latest updates on frontend tools.", level="a1"),
            NewsItem(id=6, title="Shadows in the Server Room", type="novel", summary="A suspenseful tech-fiction story.", level="b2"),
            NewsItem(id=7, title="The Neural Network That Dreamed", type="novel", summary="A funny sci-fi story about a creative AI.", level="a2"),
            NewsItem(id=8, title="Next-Gen LLMs", type="news", summary="A deep dive into parameters.", level="c2"),
        ]


@router.post("/news/content", response_model=NewsContentResponse)
async def get_news_content(request: NewsContentRequest):
    try:
        llm = create_chat_llm_with_fallback(temperature=0.7, max_tokens=1000)
        prompt = (
            f"You are a professional English tutor. Write a short article or story (around 100-150 words) "
            f"with the title '{request.title}'. The content type is '{request.type}'. "
            f"It must be written specifically at '{request.level.upper()}' CEFR level vocabulary and grammar. "
            f"Also identify 4 key vocabulary words in the text and translate them to Arabic. "
            f"Output your response strictly as a JSON object with this exact schema:\n"
            f'{{\n  "text": "the English content here",\n  "arabic_title": "Arabic translation of the title",\n  "vocabulary": [\n    {{"word": "word1", "translation": "translation1"}},\n    {{"word": "word2", "translation": "translation2"}}\n  ]\n}}\n'
            f"Return ONLY raw JSON, do not wrap in markdown code blocks."
        )
        response = await llm.ainvoke([
            {"role": "user", "content": prompt}
        ])
        raw = response.content.strip()
        
        # Clean potential markdown formatting
        if raw.startswith("```"):
            if "\n" in raw:
                raw = raw.split("\n", 1)[1]
            else:
                raw = raw.replace("```json", "").replace("```", "")
        if raw.endswith("```"):
            raw = raw.rsplit("```", 1)[0]
        raw = raw.strip()
        
        parsed = json.loads(raw)
        return NewsContentResponse(
            text=parsed.get("text", ""),
            level=request.level,
            arabic_title=parsed.get("arabic_title", request.title),
            vocabulary=parsed.get("vocabulary", [])
        )
    except Exception as e:
        logger.error(f"Error generating news content: {e}", exc_info=True)
        # Fallback response in case JSON parse fails
        return NewsContentResponse(
            text=f"This is a fallback content for '{request.title}' written at {request.level.upper()} level. It discusses the key elements of the topic.",
            level=request.level,
            arabic_title=request.title,
            vocabulary=[]
        )
