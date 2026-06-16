from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel, Field
from typing import Optional
import logging

logger = logging.getLogger(__name__)
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


def parse_llm_quiz(result: str) -> list:
    questions = []
    lines = result.strip().split("\n")
    current = None
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
            
        # Clean markdown bold/italics
        cleaned_line = line.replace("**", "").replace("*", "").strip()
        
        # Detect Question line
        is_question = False
        q_text = ""
        if cleaned_line.startswith("السؤال") or (cleaned_line and cleaned_line[0].isdigit() and (":" in cleaned_line[:10] or "." in cleaned_line[:10])):
            is_question = True
            parts = []
            if ":" in cleaned_line:
                parts = cleaned_line.split(":", 1)
            elif "." in cleaned_line:
                parts = cleaned_line.split(".", 1)
            if len(parts) > 1:
                q_text = parts[1].strip()
            else:
                q_text = cleaned_line
                
        if is_question:
            if current and (current.get("question") or current.get("options")):
                questions.append(current)
            current = {
                "question": q_text,
                "options": [],
                "correct": "",
                "explanation": ""
            }
            continue
            
        if not current:
            continue
            
        # Check if this line is option
        is_option = False
        option_text = ""
        for opt_prefix in ["أ", "ب", "ج", "د", "A", "B", "C", "D"]:
            for separator in [")", "-", ".", "ـ", " "]:
                prefix = opt_prefix + separator
                if cleaned_line.startswith(prefix):
                    is_option = True
                    option_text = cleaned_line[len(prefix):].strip()
                    break
            if is_option:
                break
        
        if is_option:
            current["options"].append(option_text)
            continue
            
        # Check for correct answer
        if "الإجابة الصحيحة" in cleaned_line or "الاجابة الصحيحة" in cleaned_line or cleaned_line.startswith("الإجابة") or cleaned_line.startswith("الاجابة"):
            parts = cleaned_line.split(":", 1)
            ans = parts[1].strip() if len(parts) > 1 else cleaned_line
            for opt_prefix in ["أ", "ب", "ج", "د", "A", "B", "C", "D"]:
                for separator in [")", "-", ".", "ـ", " "]:
                    prefix = opt_prefix + separator
                    if ans.startswith(prefix):
                        ans = ans[len(prefix):].strip()
                        break
            current["correct"] = ans
            continue
            
        # Check for explanation
        if cleaned_line.startswith("الشرح") or "التفسير" in cleaned_line:
            parts = cleaned_line.split(":", 1)
            current["explanation"] = parts[1].strip() if len(parts) > 1 else cleaned_line
            continue
            
        # Continuation of text
        if not current["options"] and not current["correct"]:
            current["question"] = (current["question"] + " " + cleaned_line).strip()
        elif current["correct"] and not current["explanation"]:
            current["explanation"] = (current["explanation"] + " " + cleaned_line).strip()
            
    if current and (current.get("question") or current.get("options")):
        questions.append(current)
        
    return questions



class QuizGenerateRequest(BaseModel):
    topic: str = Field(..., min_length=1)
    difficulty: str = Field(default="medium")
    question_count: int = Field(default=5, ge=1, le=20)
    provider: Optional[str] = None
    model: Optional[str] = None



class SummarizeRequest(BaseModel):
    content: str = Field(..., min_length=1)
    format: str = Field(default="bullet")
    language: str = Field(default="ar")
    provider: Optional[str] = None
    model: Optional[str] = None


class AskRequest(BaseModel):
    content: str = Field(..., min_length=1)
    question: str = Field(..., min_length=1)
    provider: Optional[str] = None
    model: Optional[str] = None


class GuideRequest(BaseModel):
    content: str = Field(..., min_length=1)
    subject: str = Field(default="")
    provider: Optional[str] = None
    model: Optional[str] = None


class FlashcardRequest(BaseModel):
    content: str = Field(..., min_length=1)
    count: int = Field(default=5, ge=1, le=20)
    provider: Optional[str] = None
    model: Optional[str] = None


@router.post("/summarize")
async def summarize(req: SummarizeRequest):
    result = await summarize_text(
        content=req.content,
        format=req.format,
        language=req.language,
        provider=req.provider,
        model=req.model,
    )
    return result


@router.post("/ask")
async def ask(req: AskRequest):
    result = await ask_question(
        content=req.content,
        question=req.question,
        provider=req.provider,
        model=req.model,
    )
    return result


@router.post("/guide")
async def study_guide(req: GuideRequest):
    result = await generate_guide(
        content=req.content,
        subject=req.subject,
        provider=req.provider,
        model=req.model,
    )
    return result


@router.post("/flashcards")
async def flashcards(req: FlashcardRequest):
    result = await generate_flashcards(
        content=req.content,
        count=req.count,
        provider=req.provider,
        model=req.model,
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
    provider: Optional[str] = None
    model: Optional[str] = None


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
    result = await _llm_call(system, user, provider=req.provider, model=req.model)
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
    result = await _llm_call(system, user, provider=req.provider, model=req.model)
    questions = parse_llm_quiz(result)
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
    provider: Optional[str] = None
    model: Optional[str] = None


@router.post("/transcribe-audio")
async def transcribe_audio(req: TranscribeRequest):
    # For now, use LLM to process the provided text/transcription
    system = "أنت مساعد تفريغ صوتي. المهمة: تلخيص النص وتحويله إلى نقاط رئيسية."
    user = f"النص: {req.content}\n\nقم بتفريغ النص وتلخيصه واستخراج النقاط الرئيسية."
    from app.services.study_service import _llm_call
    result = await _llm_call(system, user, provider=req.provider, model=req.model)
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
    provider: Optional[str] = None
    model: Optional[str] = None


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
    result = await _llm_call(system, user, provider=req.provider, model=req.model)
    questions = parse_llm_quiz(result)
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


async def extract_text_from_image_llm(file_path: str, provider: Optional[str] = "google", model: Optional[str] = None) -> str:
    import base64
    import os
    from app.services.agents.llm_factory import create_chat_llm
    from langchain_core.messages import HumanMessage, SystemMessage
    from app.core.config import settings
    
    with open(file_path, "rb") as f:
        base64_image = base64.b64encode(f.read()).decode("utf-8")
        
    ext = os.path.splitext(file_path)[1].lower()
    mime_type = "image/jpeg"
    if ext == ".png":
        mime_type = "image/png"
    elif ext == ".webp":
        mime_type = "image/webp"
    elif ext == ".gif":
        mime_type = "image/gif"
        
    system = (
        "أنت خبير في استخراج النصوص من الصور (OCR). "
        "استخرج النص العربي (والإنجليزي إن وجد) من الصورة بدقة كاملة وحافظ على الفقرات والتنسيق. "
        "لا تكتب أي مقدمات أو هوامش أو تفسيرات، فقط النص المستخرج مباشرة."
    )
    
    model_name = model
    if not model_name:
        if provider == "google":
            model_name = "gemini-2.5-flash"
        elif settings.llm_provider == "openrouter":
            model_name = "google/gemini-2.5-flash"
        elif settings.llm_provider == "nvidia":
            model_name = "nvidia/llama-3.2-11b-vision-instruct"
        elif settings.llm_provider == "ollama":
            model_name = settings.ollama_model
        
    llm = create_chat_llm(temperature=0.1, max_tokens=4096, streaming=False, model=model_name, provider=provider)
    
    messages = [
        SystemMessage(content=system),
        HumanMessage(content=[
            {"type": "text", "text": "استخرج النص من هذه الصورة."},
            {"type": "image_url", "image_url": {"url": f"data:{mime_type};base64,{base64_image}"}}
        ])
    ]
    
    response = await llm.ainvoke(messages)
    return response.content.strip()


async def extract_text_from_file(file_path: str, provider: Optional[str] = "google", model: Optional[str] = None) -> str:
    import os
    ext = os.path.splitext(file_path)[1].lower()
    if ext == '.pdf':
        import fitz
        doc = fitz.open(file_path)
        text = ""
        for page in doc:
            text += page.get_text()
        doc.close()
        return text
    elif ext == '.docx':
        import zipfile
        import xml.etree.ElementTree as ET
        try:
            with zipfile.ZipFile(file_path) as docx:
                xml_content = docx.read('word/document.xml')
                root = ET.fromstring(xml_content)
                namespaces = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
                paragraphs = []
                for para in root.findall('.//w:p', namespaces):
                    texts = [node.text for node in para.findall('.//w:t', namespaces) if node.text]
                    if texts:
                        paragraphs.append("".join(texts))
                return "\n".join(paragraphs)
        except Exception as e:
            raise ValueError(f"Failed to parse Word file: {e}")
    elif ext in ('.png', '.jpg', '.jpeg', '.webp'):
        try:
            return await extract_text_from_image_llm(file_path, provider=provider, model=model)
        except Exception as e:
            logger.warning(f"LLM Vision OCR failed: {e}")
            try:
                import pytesseract
                from PIL import Image
                img = Image.open(file_path)
                return pytesseract.image_to_string(img, lang='ara+eng').strip()
            except Exception as le:
                logger.error(f"Local OCR fallback failed: {le}")
                raise ValueError(f"Failed to extract text from image: {e}")
    else:
        # Default text read
        for encoding in ('utf-8', 'latin-1', 'cp1256'):
            try:
                with open(file_path, 'r', encoding=encoding) as f:
                    return f.read()
            except Exception:
                continue
        raise ValueError("Unsupported or unreadable file encoding")


from fastapi import Form

@router.post("/extract-text")
async def extract_text(file: UploadFile = File(...), provider: str = Form("google"), model: Optional[str] = Form(None)):
    import tempfile
    import os
    
    filename = file.filename or ""
    suffix = os.path.splitext(filename)[1]
    
    temp_fd, temp_path = tempfile.mkstemp(suffix=suffix)
    try:
        with os.fdopen(temp_fd, 'wb') as tmp:
            tmp.write(await file.read())
        
        text = await extract_text_from_file(temp_path, provider=provider, model=model)
        if not text:
            raise HTTPException(status_code=400, detail="Could not extract text from file")
        return {"filename": filename, "text": text}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        try:
            os.remove(temp_path)
        except Exception:
            pass


@router.post("/study-assistant")
async def study_assistant_file(
    file: UploadFile = File(...),
    difficulty: str = Form("medium"),
    question_count: int = Form(5),
    provider: str = Form("google"),
    model: Optional[str] = Form(None)
):
    import tempfile
    import os
    
    filename = file.filename or ""
    suffix = os.path.splitext(filename)[1].lower()
    if suffix not in ('.pdf', '.docx', '.txt', '.png', '.jpg', '.jpeg', '.webp'):
        raise HTTPException(status_code=400, detail="Only PDF, DOCX, TXT, and images (PNG, JPG, JPEG, WEBP) are supported")
        
    temp_fd, temp_path = tempfile.mkstemp(suffix=suffix)
    try:
        with os.fdopen(temp_fd, 'wb') as tmp:
            tmp.write(await file.read())
        
        text = await extract_text_from_file(temp_path, provider=provider, model=model)
        if not text or not text.strip():
            raise HTTPException(status_code=400, detail="The uploaded file contains no readable text")
        
        # 1. Generate Summary
        from app.services.study_service import summarize_text
        summary_res = await summarize_text(content=text[:10000], format="key_points", language="ar", provider=provider)
        
        # 2. Generate Quiz
        from app.services.study_service import _llm_call
        difficulty_desc = {"easy": "أساسية", "medium": "متوسطة", "hard": "متقدمة"}
        system = "أنت مدرس خبير في إعداد الاختبارات."
        user = (
            f"المحتوى: {text[:8000]}\n"
            f"المستوى: {difficulty_desc.get(difficulty, 'متوسطة')}\n"
            f"عدد الأسئلة: {question_count}\n\n"
            f"أنشئ اختباراً من المحتوى أعلاه. التنسيق:\n"
            f"السؤال 1: ...\nأ) ...\nب) ...\nج) ...\nد) ...\n"
            f"الإجابة الصحيحة: حرف الخيار\nالشرح: ...\n"
        )
        result = await _llm_call(system, user, provider=provider)
        questions = parse_llm_quiz(result)
            
        return {
            "filename": filename,
            "summary": summary_res,
            "quiz": questions[:question_count]
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        try:
            os.remove(temp_path)
        except Exception:
            pass


class StudyChatRequest(BaseModel):
    message: str
    system_instruction: Optional[str] = None
    history: Optional[list[dict]] = None
    provider: Optional[str] = None
    model: Optional[str] = None


@router.post("/chat")
async def study_chat(req: StudyChatRequest):
    try:
        from app.services.agents.llm_factory import create_chat_llm_with_fallback
        from langchain_core.messages import SystemMessage, HumanMessage, AIMessage

        messages = []
        if req.system_instruction:
            messages.append(SystemMessage(content=req.system_instruction))
        
        if req.history:
            for msg in req.history:
                role = msg.get("role")
                content = ""
                if "parts" in msg:
                    parts = msg["parts"]
                    if isinstance(parts, list) and len(parts) > 0:
                        content = parts[0].get("text", "")
                else:
                    content = msg.get("content", "")
                
                if role in ("model", "assistant"):
                    messages.append(AIMessage(content=content))
                else:
                    messages.append(HumanMessage(content=content))
        
        messages.append(HumanMessage(content=req.message))

        llm = create_chat_llm_with_fallback(
            temperature=0.5,
            max_tokens=2048,
            streaming=False,
            provider=req.provider,
            model=req.model
        )
        
        response = await llm.ainvoke(messages)
        return {"response": response.content.strip()}
    except Exception as e:
        logger.error(f"Study chat error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

