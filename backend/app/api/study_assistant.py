from fastapi import APIRouter, HTTPException, UploadFile, File
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


class MindMapRequest(BaseModel):
    content: str = Field(..., min_length=1)
    depth: int = Field(default=2, ge=1, le=4)


@router.post("/generate-mindmap")
async def generate_mindmap(req: MindMapRequest):
    system = "أنت خبير في إنشاء خرائط ذهنية تعليمية. أخرج الخريطة بتنسيق JSON فقط."
    user = (
        f"المحتوى: {req.content}\n"
        f"عدد المستويات: {req.depth}\n\n"
        f"قم بإنشاء خريطة ذهنية على شكل JSON بالتنسيق التالي:\n"
        f"{{\n"
        f'  "root": {{ "id": "r1", "title": "الموضوع الرئيسي", "children": [\n'
        f'    {{ "id": "n1", "title": "مفهوم رئيسي 1", "children": [\n'
        f'      {{ "id": "n1a", "title": "مفهوم فرعي", "children": [] }}\n'
        f'    ]}}\n'
        f"  ]}}\n"
        f"}}\n\n"
        f"أخرج JSON فقط بدون أي نص إضافي."
    )
    result = await _llm_call(system, user)
    from json import loads as json_loads, JSONDecodeError
    try:
        tree = json_loads(result.strip())
        return {"tree": tree}
    except JSONDecodeError:
        return {
            "tree": {
                "id": "r1", "title": req.content[:60],
                "children": [
                    {"id": "n1", "title": "مقدمة", "children": []},
                    {"id": "n2", "title": "مفاهيم أساسية", "children": []},
                    {"id": "n3", "title": "تطبيقات", "children": []},
                ],
            }
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


# --- Audio Transcription ---
class TranscribeRequest(BaseModel):
    content: str = Field(..., min_length=1)  # base64 or text fallback


@router.post("/transcribe-audio")
async def transcribe_audio(req: TranscribeRequest):
    # For now, use LLM to process the provided text/transcription
    system = "أنت مساعد تفريغ صوتي. المهمة: تلخيص النص وتحويله إلى نقاط رئيسية."
    user = f"النص: {req.content}\n\nقم بتفريغ النص وتلخيصه واستخراج النقاط الرئيسية."
    from app.services.study_service import _llm_call
    result = await _llm_call(system, user)
    return {
        "transcription": req.content,
        "summary": result.strip(),
        "key_points": result.strip().split("\n")[:5],
    }


# --- Quiz from File ---
class QuizFromFileRequest(BaseModel):
    content: str = Field(..., min_length=1)
    difficulty: str = Field(default="medium")
    question_count: int = Field(default=5, ge=1, le=20)


@router.post("/generate-quiz-from-file")
async def generate_quiz_from_file(req: QuizFromFileRequest):
    from app.services.study_service import _llm_call
    system = "أنت مدرس خبير في إعداد الاختبارات."
    difficulty_desc = {"easy": "أساسية", "medium": "متوسطة", "hard": "متقدمة"}
    user = (
        f"المحتوى: {req.content}\n"
        f"المستوى: {difficulty_desc.get(req.difficulty, 'متوسطة')}\n"
        f"عدد الأسئلة: {req.question_count}\n\n"
        f"أنشئ اختباراً من المحتوى أعلاه. التنسيق:\n"
        f"السؤال 1: ...\nأ) ...\nب) ...\nج) ...\nد) ...\n"
        f"الإجابة الصحيحة: حرف الخيار\nالشرح: ...\n"
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
    return {"questions": questions[: req.question_count]}


# --- Grade Prediction ---
@router.post("/predict-grades")
async def predict_grades():
    from app.services.study_service import _llm_call
    system = "أنت مستشار أكاديمي خبير في تحليل الأداء الدراسي والتنبؤ بالنتائج."
    user = (
        "بناءً على نظام تعلم إلكتروني، قم بتوليد توقعات ذكية للدرجات لطالب جامعي.\n"
        "أخرج التنبؤات بصيغة JSON:\n"
        "[\n"
        '  { "course": "اسم المادة", "predicted_grade": "ممتاز/جيد جداً/جيد/مقبول", "confidence": 85, "recommendation": "توصية" },\n'
        "  ...\n"
        "]\n"
        "أخرج JSON فقط بدون أي نص إضافي."
    )
    result = await _llm_call(system, user)
    import json
    try:
        predictions = json.loads(result.strip())
    except json.JSONDecodeError:
        predictions = [
            {"course": "الذكاء الاصطناعي", "predicted_grade": "ممتاز", "confidence": 90, "recommendation": "استمر في أدائك المتميز"},
            {"course": "قواعد البيانات", "predicted_grade": "جيد جداً", "confidence": 80, "recommendation": "ركز على الاستعلامات المعقدة"},
            {"course": "شبكات الحاسب", "predicted_grade": "جيد", "confidence": 70, "recommendation": "حاول حل المزيد من التمارين العملية"},
        ]
    return {"predictions": predictions}


@router.post("/extract-text")
async def extract_text(file: UploadFile = File(...)):
    import tempfile
    import os
    
    # Save UploadFile to a temporary file with correct extension
    filename = file.filename or ""
    suffix = os.path.splitext(filename)[1]
    
    temp_fd, temp_path = tempfile.mkstemp(suffix=suffix)
    try:
        with os.fdopen(temp_fd, 'wb') as tmp:
            tmp.write(await file.read())
        
        # Use existing load_file_content to extract text
        text = await load_file_content(temp_path)
        if not text:
            raise HTTPException(status_code=400, detail="Could not extract text from file")
        return {"filename": filename, "text": text}
    finally:
        try:
            os.remove(temp_path)
        except Exception:
            pass
