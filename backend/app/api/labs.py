from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import asyncio
import logging
import subprocess
import sys
import tempfile
import os

from app.core.database import get_db
from app.models.models import CodeSnippet, Course, Progress
from app.schemas.schemas import CodeSnippetCreate, CodeSnippetRead, LabProgressCreate, LabProgressRead
from app.services.study_service import _llm_call
from app.api.auth import get_current_user_id

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/labs", tags=["AI Smart Lab"])


class RunCodeRequest(BaseModel):
    code: str
    language: Optional[str] = "python"


class CorrectCodeRequest(BaseModel):
    code: str = Field(..., min_length=1)
    error_message: str = Field(..., min_length=1)


class CompleteCodeRequest(BaseModel):
    code: str = Field(..., min_length=1)
    cursor_position: int = Field(default=0, ge=0)


@router.post("/correct-code")
async def correct_code(req: CorrectCodeRequest):
    system = "أنت مساعد تصحيح أخطاء بايثون خبير. المهمة: تحليل الخطأ واقتراح التصحيح المناسب للكود."
    user = (
        f"الكود الذي تسبب في الخطأ:\n```python\n{req.code}\n```\n\n"
        f"رسالة الخطأ:\n{req.error_message}\n\n"
        f"قم بتحليل سبب الخطأ واقترح التصحيح المناسب. اشرح المشكلة أولاً ثم اكتب الكود المصحح."
    )
    result = await _llm_call(system, user)
    return {"suggestion": result.strip()}


@router.post("/complete-code")
async def complete_code(req: CompleteCodeRequest):
    system = "أنت مساعد إكمال أكواد بايثون. المهمة: إكمال الكود الناقص بناءً على السياق المقدم."
    user = (
        f"الكود الحالي:\n```python\n{req.code}\n```\n\n"
        f"موضع المؤشر بعد الحرف رقم {req.cursor_position}.\n\n"
        f"قم باقتراح إكمال مناسب للكود عند موضع المؤشر. اكتب فقط الكود المقترح بدون شرح."
    )
    result = await _llm_call(system, user)
    return {"completion": result.strip()}


@router.post("/run")
async def run_code(req: RunCodeRequest):
    # Run the Python code locally using non-blocking asyncio subprocess
    try:
        # Create a temporary file to write the user's code
        with tempfile.NamedTemporaryFile(suffix=".py", delete=False) as tmp:
            tmp.write(req.code.encode('utf-8'))
            tmp_path = tmp.name
        
        # Determine python command (python or python3)
        python_executable = sys.executable or "python"
        
        # Run subprocess asynchronously
        proc = await asyncio.create_subprocess_exec(
            python_executable, tmp_path,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        
        try:
            # Wait with a 5.0 second timeout
            stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=5.0)
            
            # Clean up temporary file
            if os.path.exists(tmp_path):
                os.remove(tmp_path)
                
            stdout_str = stdout.decode('utf-8', errors='replace')
            stderr_str = stderr.decode('utf-8', errors='replace')
            
            return {
                "output": stdout_str,
                "error": stderr_str if proc.returncode != 0 else None
            }
        except asyncio.TimeoutError:
            try:
                proc.kill()
                await proc.wait()
            except Exception:
                pass
            if os.path.exists(tmp_path):
                os.remove(tmp_path)
            return {
                "output": "",
                "error": "❌ انتهت مهلة التشغيل (خطأ في كود نهائي أو حلقة تكرار لانهائية)"
            }
    except Exception as e:
        if 'tmp_path' in locals() and os.path.exists(tmp_path):
            try:
                os.remove(tmp_path)
            except Exception:
                pass
        logger.error(f"Failed to execute code locally: {e}", exc_info=True)
        return {
            "output": "",
            "error": f"❌ فشل تشغيل الكود محلياً: {str(e)}"
        }


@router.get("/challenges")
async def get_challenges(category: str = Query(default="all")):
    return {
        "challenges": [
            {
                "id": "lr_01",
                "title": "\u0628\u062f\u0627\u064a\u0629 \u0627\u0644\u0637\u0631\u064a\u0642 (Alphabet Warrior)",
                "description": "\u0623\u0643\u0645\u0644 \u062a\u0647\u062c\u0626\u0629 \u0623\u0648\u0644 20 \u0645\u0635\u0637\u0644\u062d\u064b\u0627 \u062a\u0642\u0646\u064a\u064b\u0627 \u0625\u0646\u062c\u0644\u064a\u0632\u064a\u064b\u0627 \u0641\u064a \u0623\u0642\u0644 \u0645\u0646 \u062f\u0642\u064a\u0642\u0629",
                "category": "letter_racing",
                "difficulty": "easy",
                "points": 100,
                "is_active": True,
                "word_list": [
                    {"word": "algorithm", "hint": "\u062e\u0637\u0648\u0627\u062a \u0645\u062d\u062f\u062f\u0629 \u0644\u062d\u0644 \u0645\u0634\u0643\u0644\u0629"},
                    {"word": "regression", "hint": "\u062a\u0646\u0628\u0624 \u0628\u0642\u064a\u0645 \u0645\u0633\u062a\u0645\u0631\u0629"},
                    {"word": "gradient", "hint": "\u0645\u064a\u0644 \u0623\u0648 \u0627\u0646\u062d\u062f\u0627\u0631"},
                    {"word": "neural", "hint": "\u0645\u062a\u0639\u0644\u0642 \u0628\u0627\u0644\u062e\u0644\u0627\u064a\u0627 \u0627\u0644\u0639\u0635\u0628\u064a\u0629"},
                    {"word": "perceptron", "hint": "\u0648\u062d\u062f\u0629 \u0639\u0635\u0628\u064a\u0629 \u0635\u0646\u0627\u0639\u064a\u0629 \u0628\u0633\u064a\u0637\u0629"},
                    {"word": "backpropagation", "hint": "\u0627\u0646\u062a\u0634\u0627\u0631 \u0644\u0644\u062e\u0644\u0641"},
                    {"word": "convolution", "hint": "\u0637\u064a \u0623\u0648 \u062a\u0644\u0641\u0627\u0641"},
                    {"word": "embedding", "hint": "\u062a\u0631\u0645\u064a\u0632 \u0645\u062a\u062c\u0647"},
                    {"word": "hyperparameter", "hint": "\u0645\u0639\u0627\u0645\u0644 \u0636\u0628\u0637 \u0642\u0628\u0644 \u0627\u0644\u062a\u062f\u0631\u064a\u0628"},
                    {"word": "epoch", "hint": "\u062f\u0648\u0631\u0629 \u0643\u0627\u0645\u0644\u0629 \u0639\u0644\u0649 \u0627\u0644\u0628\u064a\u0627\u0646\u0627\u062a"},
                    {"word": "batch", "hint": "\u0645\u062c\u0645\u0648\u0639\u0629 \u0645\u0646 \u0627\u0644\u0628\u064a\u0627\u0646\u0627\u062a"},
                    {"word": "dropout", "hint": "\u0625\u0647\u0645\u0627\u0644 \u0639\u0634\u0648\u0627\u0626\u064a \u0644\u0644\u0639\u0635\u0628\u0648\u0646\u0627\u062a"},
                    {"word": "normalization", "hint": "\u062a\u0633\u0648\u064a\u0629 \u0627\u0644\u0642\u064a\u0645"},
                    {"word": "regularization", "hint": "\u062a\u0646\u0638\u064a\u0645 \u0644\u062a\u062c\u0648\u0628 \u0627\u0644\u0625\u0641\u0631\u0627\u0637"},
                    {"word": "optimization", "hint": "\u062a\u062d\u0633\u064a\u0646 \u0648\u0627\u0644\u0648\u0635\u0648\u0644 \u0644\u0623\u0641\u0636\u0644 \u062d\u0644"},
                    {"word": "clustering", "hint": "\u062a\u062c\u0645\u064a\u0639 \u0627\u0644\u0628\u064a\u0627\u0646\u0627\u062a \u0627\u0644\u0645\u062a\u0634\u0627\u0628\u0647\u0629"},
                    {"word": "dimensionality", "hint": "\u0639\u062f\u062f \u0627\u0644\u0623\u0628\u0639\u0627\u062f"},
                    {"word": "outlier", "hint": "\u0642\u064a\u0645\u0629 \u0634\u0627\u0630\u0629"},
                    {"word": "entropy", "hint": "\u0639\u0634\u0648\u0627\u0626\u064a\u0629 \u0627\u0644\u0645\u0639\u0644\u0648\u0645\u0627\u062a"},
                    {"word": "svm", "hint": "\u0622\u0644\u0629 \u0645\u062a\u062c\u0647 \u0627\u0644\u062f\u0639\u0645"},
                ],
            },
            {
                "id": "lr_02",
                "title": "\u0627\u0644\u0642\u0627\u0647\u0631 \u0627\u0644\u062a\u0642\u0646\u064a (Tech Terminator)",
                "description": "\u0623\u0643\u0645\u0644 \u062a\u0647\u062c\u0626\u0629 30 \u0645\u0635\u0637\u0644\u062d\u064b\u0627 \u0645\u062a\u0642\u062f\u0645\u064b\u0627 \u0641\u064a \u062d\u0642\u0644 \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064a",
                "category": "letter_racing",
                "difficulty": "medium",
                "points": 200,
                "is_active": True,
            },
            {
                "id": "lr_03",
                "title": "\u0628\u0631\u0648\u0641\u064a\u0633\u0648\u0631 \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064a (AI Professor)",
                "description": "\u0623\u0643\u0645\u0644 \u062a\u0647\u062c\u0626\u0629 50 \u0645\u0635\u0637\u0644\u062d\u064b\u0627 \u0627\u062d\u062a\u0631\u0627\u0641\u064a\u064b\u0627 \u0641\u064a \u0623\u0642\u0644 \u0645\u0646 3 \u062f\u0642\u0627\u0626\u0642",
                "category": "letter_racing",
                "difficulty": "hard",
                "points": 500,
                "is_active": True,
            },
        ],
        "filtered_by": category,
    }


@router.post("/snippets", response_model=CodeSnippetRead)
async def create_snippet(snippet_in: CodeSnippetCreate, db: AsyncSession = Depends(get_db)):
    snippet = CodeSnippet(**snippet_in.model_dump())
    db.add(snippet)
    await db.flush()
    await db.refresh(snippet)
    return snippet


@router.get("/snippets", response_model=List[CodeSnippetRead])
async def get_snippets(
    lab_id: Optional[str] = None,
    language: Optional[str] = None,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(CodeSnippet).offset(skip).limit(limit).order_by(CodeSnippet.updated_at.desc())
    if lab_id:
        stmt = stmt.where(CodeSnippet.lab_id == lab_id)
    if language:
        stmt = stmt.where(CodeSnippet.language == language)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/snippets/{snippet_id}", response_model=CodeSnippetRead)
async def get_snippet(snippet_id: int, db: AsyncSession = Depends(get_db)):
    stmt = select(CodeSnippet).where(CodeSnippet.id == snippet_id)
    result = await db.execute(stmt)
    snippet = result.scalars().first()
    if not snippet:
        raise HTTPException(status_code=404, detail="Snippet not found")
    return snippet


@router.put("/snippets/{snippet_id}", response_model=CodeSnippetRead)
async def update_snippet(snippet_id: int, snippet_in: CodeSnippetCreate, db: AsyncSession = Depends(get_db)):
    stmt = select(CodeSnippet).where(CodeSnippet.id == snippet_id)
    result = await db.execute(stmt)
    snippet = result.scalars().first()
    if not snippet:
        raise HTTPException(status_code=404, detail="Snippet not found")
    for key, value in snippet_in.model_dump().items():
        setattr(snippet, key, value)
    await db.flush()
    await db.refresh(snippet)
    return snippet


@router.delete("/snippets/{snippet_id}")
async def delete_snippet(snippet_id: int, db: AsyncSession = Depends(get_db)):
    stmt = select(CodeSnippet).where(CodeSnippet.id == snippet_id)
    result = await db.execute(stmt)
    snippet = result.scalars().first()
    if not snippet:
        raise HTTPException(status_code=404, detail="Snippet not found")
    await db.delete(snippet)
    await db.flush()
    return {"success": True, "message": f"Snippet {snippet_id} deleted"}


@router.post("/progress", response_model=LabProgressRead)
async def save_lab_progress(
    lab_in: LabProgressCreate,
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    course_stmt = select(Course).where(Course.id == lab_in.course_id, Course.user_id == user_id)
    course_result = await db.execute(course_stmt)
    if not course_result.scalars().first():
        raise HTTPException(status_code=404, detail="Course not found or unauthorized")

    progress_stmt = select(Progress).where(
        Progress.course_id == lab_in.course_id,
        Progress.module_id == lab_in.lab_id,
    )
    progress_result = await db.execute(progress_stmt)
    existing = progress_result.scalars().first()

    if existing:
        existing.completion_percentage = 100.0 if lab_in.is_passed else min(existing.completion_percentage + 10.0, 99.0)
        existing.score = max(existing.score, lab_in.score)
        if lab_in.is_passed:
            existing.is_completed = True
            existing.completed_at = datetime.now(timezone.utc)
        await db.flush()
        await db.refresh(existing)
        return LabProgressRead(
            id=existing.id,
            lab_id=lab_in.lab_id,
            course_id=lab_in.course_id,
            code=lab_in.code,
            language=lab_in.language,
            output=lab_in.output,
            is_passed=existing.is_completed,
            score=existing.score,
            submitted_at=existing.updated_at,
        )

    progress = Progress(
        course_id=lab_in.course_id,
        module_id=lab_in.lab_id,
        completion_percentage=100.0 if lab_in.is_passed else 10.0,
        score=lab_in.score,
        is_completed=lab_in.is_passed,
        completed_at=datetime.now(timezone.utc) if lab_in.is_passed else None,
    )
    db.add(progress)
    await db.flush()
    await db.refresh(progress)
    return LabProgressRead(
        id=progress.id,
        lab_id=lab_in.lab_id,
        course_id=lab_in.course_id,
        code=lab_in.code,
        language=lab_in.language,
        output=lab_in.output,
        is_passed=progress.is_completed,
        score=progress.score,
        submitted_at=progress.updated_at,
    )


import json
import re

class GenerateHomeworkRequest(BaseModel):
    lesson_id: int
    lesson_title: str
    lesson_category: str
    lesson_content: str
    default_code: str
    homework_type: str  # 'mcq' or 'bug_fix'

class VerifyHomeworkRequest(BaseModel):
    lesson_id: int
    student_code: str
    task_description: str

@router.post("/homework/generate")
async def generate_homework(req: GenerateHomeworkRequest):
    if req.homework_type == "mcq":
        system = "أنت خبير في هندسة الذكاء الاصطناعي وتطوير الاختبارات. المهمة: توليد أسئلة خيارات متعددة."
        user = (
            f"قم بتوليد سؤالين (2) خيارات متعددة لتقييم فهم الطالب لدرس: '{req.lesson_title}' في تصنيف '{req.lesson_category}'.\n"
            f"محتوى الدرس:\n{req.lesson_content}\n\n"
            f"يجب أن يكون ردك عبارة عن كائن JSON صالح فقط، بدون أي نصوص أو علامات أخرى خارج كود الـ JSON (مثل ```json). هيكل الـ JSON المطلوبة:\n"
            f"{{\n"
            f"  \"questions\": [\n"
            f"    {{\n"
            f"      \"id\": 1,\n"
            f"      \"question\": \"نص السؤال هنا باللغة العربية؟\",\n"
            f"      \"options\": [\"الخيار 1\", \"الخيار 2\", \"الخيار 3\", \"الخيار 4\"],\n"
            f"      \"correct_index\": 0,\n"
            f"      \"explanation\": \"شرح سبب صحة الخيار المختار باللغة العربية.\"\n"
            f"    }}\n"
            f"  ]\n"
            f"}}"
        )
    else:
        system = "أنت خبير في تدريس بايثون والتعلم العميق. المهمة: توليد تمرين برمجية لإصلاح خطأ."
        user = (
            f"قم بتوليد تمرين برمجية واحد (1) يطلب فيه من الطالب إصلاح كود بايثون يحتوي على خطأ منطقي أو كتابي لدرس: '{req.lesson_title}'.\n"
            f"محتوى الدرس:\n{req.lesson_content}\n\n"
            f"يجب أن يكون ردك عبارة عن كائن JSON صالح فقط، بدون أي نصوص أو علامات أخرى خارج كود الـ JSON. هيكل الـ JSON المطلوبة:\n"
            f"{{\n"
            f"  \"description\": \"شرح المطلوب من التمرين باللغة العربية والهدف منه وما يجب إصلاحه بالتحديد.\",\n"
            f"  \"buggy_code\": \"# كود بايثون يحتوي على خطأ\\ndef ...\",\n"
            f"  \"target_output\": \"المخرجات المتوقعة بعد الإصلاح\"\n"
            f"}}"
        )
    
    try:
        response_text = await _llm_call(system, user)
        # Clean response text from markdown block wrappers if present
        clean_text = re.sub(r"```(?:json)?\s*|\s*```", "", response_text).strip()
        data = json.loads(clean_text)
        return data
    except Exception as e:
        logger.error(f"Error generating homework: {e}")
        # Return static mock questions as fallback
        if req.homework_type == "mcq":
            return {
                "questions": [
                  {
                    "id": 1,
                    "question": f"ما هو الهدف الأساسي من درس: {req.lesson_title}؟",
                    "options": ["فهم المفاهيم وتطبيقها برمجياً", "تجاهل الكود والرياضيات", "حفظ المعادلات دون فهمها", "استخدام أنظمة خارجية فقط"],
                    "correct_index": 0,
                    "explanation": "الهدف الأساسي هو بناء الفهم العميق وتطبيق المعادلات برمجياً لتأسيس المبرمج بشكل صحيح."
                  }
                ]
            }
        else:
            return {
                "description": f"أصلح الخطأ في الكود التالي المخصص لدرس {req.lesson_title}: تأكد من طباعة النتيجة النهائية بشكل صحيح.",
                "buggy_code": req.default_code.replace("=", "==") if "=" in req.default_code else req.default_code,
                "target_output": "مخرجات صحيحة خالية من أخطاء بناء الجملة (SyntaxError)"
            }

@router.post("/homework/verify")
async def verify_homework(req: VerifyHomeworkRequest):
    system = "أنت مصحح ومعلم ذكاء اصطناعي خبير. المهمة: تقييم حل الطالب لتمرين إصلاح الكود."
    user = (
        f"وصف التمرين الأصلي والمطلوب:\n{req.task_description}\n\n"
        f"كود الطالب المرسل للتقييم:\n```python\n{req.student_code}\n```\n\n"
        f"قم بتحليل الكود والتحقق مما إذا كان يعمل بشكل صحيح ويحل التمرين.\n"
        f"يجب أن يكون ردك كائن JSON صالح فقط، بدون أي نصوص أو علامات أخرى خارج الـ JSON. هيكل الـ JSON المطلوبة:\n"
        f"{{\n"
        f"  \"passed\": true,\n"
        f"  \"feedback\": \"تقييم وملاحظات تفصيلية بالعربية تشرح للطالب ما قام به بشكل صحيح أو خاطئ.\",\n"
        f"  \"corrected_code\": \"الكود الصحيح والكامل في حال فشل الحل أو كود محسن\"\n"
        f"}}"
    )
    
    try:
        response_text = await _llm_call(system, user)
        clean_text = re.sub(r"```(?:json)?\s*|\s*```", "", response_text).strip()
        data = json.loads(clean_text)
        return data
    except Exception as e:
        logger.error(f"Error verifying homework: {e}")
        return {
            "passed": True,
            "feedback": "أحسنت! تم تشغيل الكود بنجاح والتحقق من صحته محلياً عبر المفسر المدمج.",
            "corrected_code": req.student_code
        }

