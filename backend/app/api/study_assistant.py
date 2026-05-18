from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional
from sqlalchemy import select
from app.core.database import async_session_factory
from app.models.models import Note as NoteModel, Subject as SubjectModel, SubjectFile as SubjectFileModel
from app.services.study_service import (
    summarize_text,
    ask_question,
    generate_guide,
    generate_flashcards,
    load_file_content,
)

router = APIRouter(prefix="/study", tags=["study"])


class QuizGenerateRequest(BaseModel):
    topic: str = Field(..., min_length=1)
    difficulty: str = Field(default="medium")
    question_count: int = Field(default=5, ge=1, le=20)



class SummarizeRequest(BaseModel):
    content: str = Field(..., min_length=1)
    format: str = Field(default="bullet")
    language: str = Field(default="ar")


class AskRequest(BaseModel):
    content: str = Field(..., min_length=1)
    question: str = Field(..., min_length=1)


class GuideRequest(BaseModel):
    content: str = Field(..., min_length=1)
    subject: str = Field(default="")


class FlashcardRequest(BaseModel):
    content: str = Field(..., min_length=1)
    count: int = Field(default=5, ge=1, le=20)


@router.post("/summarize")
async def summarize(req: SummarizeRequest):
    result = await summarize_text(
        content=req.content,
        format=req.format,
        language=req.language,
    )
    return result


@router.post("/ask")
async def ask(req: AskRequest):
    result = await ask_question(
        content=req.content,
        question=req.question,
    )
    return result


@router.post("/guide")
async def study_guide(req: GuideRequest):
    result = await generate_guide(
        content=req.content,
        subject=req.subject,
    )
    return result


@router.post("/flashcards")
async def flashcards(req: FlashcardRequest):
    result = await generate_flashcards(
        content=req.content,
        count=req.count,
    )
    return result


@router.post("/summarize-note/{note_id}")
async def summarize_note(note_id: int):
    async with async_session_factory() as session:
        result = await session.execute(select(NoteModel).where(NoteModel.id == note_id))
        note = result.scalar_one_or_none()
        if not note:
            raise HTTPException(status_code=404, detail="Note not found")
        content = note.content or ""
        if note.type == "voice" and note.audio_file_path:
            content = await load_file_content(note.audio_file_path) or ""
        if not content:
            raise HTTPException(status_code=400, detail="Note has no content to summarize")

        summary_result = await summarize_text(content=content, format="key_points", language="ar")
        combined = f"--- ملخص تلقائي ---\n{summary_result['summary']}\n\n--- النقاط الرئيسية ---\n" + "\n".join(f"- {p}" for p in summary_result["key_points"])
        note.content = (note.content or "") + "\n\n" + combined if note.content else combined
        await session.commit()
        return {
            "summary": summary_result["summary"],
            "key_points": summary_result["key_points"],
            "original_length": summary_result["original_length"],
            "summary_length": summary_result["summary_length"],
        }


@router.post("/summarize-subject/{subject_id}")
async def summarize_subject(subject_id: int):
    async with async_session_factory() as session:
        result = await session.execute(select(SubjectModel).where(SubjectModel.id == subject_id))
        subject = result.scalar_one_or_none()
        if not subject:
            raise HTTPException(status_code=404, detail="Subject not found")

        files_result = await session.execute(
            select(SubjectFileModel).where(SubjectFileModel.subject_id == subject_id)
        )
        files = files_result.scalars().all()

        if not files:
            raise HTTPException(status_code=400, detail="No files found for this subject")

        all_content_parts = []
        file_summaries = []
        for f in files:
            file_content = await load_file_content(f.file_path)
            if file_content:
                all_content_parts.append(f"--- {f.original_name} ---\n{file_content}")
                fs = await summarize_text(content=file_content[:3000], format="key_points", language="ar")
                file_summaries.append({
                    "filename": f.original_name,
                    "summary": fs["summary"],
                    "key_points": fs["key_points"],
                })

        combined_content = "\n\n".join(all_content_parts)
        if not combined_content:
            raise HTTPException(status_code=400, detail="Could not read any files")

        overall = await summarize_text(content=combined_content[:6000], format="key_points", language="ar")

        return {
            "subject_name": subject.name,
            "file_count": len(file_summaries),
            "file_summaries": file_summaries,
            "overall_summary": overall["summary"],
            "overall_key_points": overall["key_points"],
        }


@router.post("/generate-quiz")
async def generate_quiz(req: QuizGenerateRequest):
    from app.services.study_service import _llm_call

    system = "أنت مدرس خبير في إعداد الاختبارات. أنشئ اختباراً تعليمياً مناسباً للطلاب."
    difficulty_desc = {
        "easy": "أسئلة أساسية بسيطة تقيس الفهم العام.",
        "medium": "أسئلة متوسطة تقيس الفهم والتطبيق.",
        "hard": "أسئلة متقدمة تقيس التحليل والاستنتاج والتقييم.",
    }
    diff_text = difficulty_desc.get(req.difficulty, difficulty_desc["medium"])
    user = (
        f"الموضوع: {req.topic}\n"
        f"المستوى: {req.difficulty} - {diff_text}\n"
        f"عدد الأسئلة: {req.question_count}\n\n"
        f"لكل سؤال: اكتب السؤال، 4 خيارات، الإجابة الصحيحة، وشرح للإجابة.\n"
        f"التنسيق:\n"
        f"السؤال 1: ...\n"
        f"أ) ...\nب) ...\nج) ...\nد) ...\n"
        f"الإجابة الصحيحة: حرف الخيار\n"
        f"الشرح: ...\n"
    )
    result = await _llm_call(system, user)
    questions = []
    lines = result.strip().split("\n")
    current = {}
    for line in lines:
        line = line.strip()
        if not line:
            continue
        lower = line
        if lower.startswith("السؤال") or (line and line[0].isdigit() and ":" in line[:4]):
            if current.get("question"):
                questions.append(current)
            current = {"question": line.split(":", 1)[1].strip() if ":" in line else line, "options": [], "correct": "", "explanation": ""}
        elif line.startswith("أ)") or line.startswith("أـ"):
            current.setdefault("options", []).append(line[3:].strip() if len(line) > 3 else line)
        elif line.startswith("ب)") or line.startswith("بـ"):
            current.setdefault("options", []).append(line[3:].strip() if len(line) > 3 else line)
        elif line.startswith("ج)") or line.startswith("جـ"):
            current.setdefault("options", []).append(line[3:].strip() if len(line) > 3 else line)
        elif line.startswith("د)") or line.startswith("دـ"):
            current.setdefault("options", []).append(line[3:].strip() if len(line) > 3 else line)
        elif "الإجابة" in lower or "الاجابة" in lower:
            current["correct"] = line.split(":", 1)[1].strip() if ":" in line else ""
        elif lower.startswith("الشرح"):
            current["explanation"] = line.split(":", 1)[1].strip() if ":" in line else ""
    if current.get("question"):
        questions.append(current)
    if not questions:
        blocks = result.strip().split("\n\n")
        for block in blocks:
            lines_in = [l.strip() for l in block.split("\n") if l.strip()]
            if len(lines_in) >= 2:
                questions.append({"question": lines_in[0], "options": lines_in[1:5] if len(lines_in) > 4 else lines_in[1:], "correct": "", "explanation": ""})
    return {"questions": questions[: req.question_count]}
