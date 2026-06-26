"""
Projects API — Project Generation & Management
مسارات توليد وإدارة المشاريع التعليمية
"""
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional

router = APIRouter(prefix="/projects", tags=["projects"])

# ── In-memory project store ──────────────────────────────────────────
_projects: dict[str, dict] = {}


class ProjectGenerateRequest(BaseModel):
    interests: str
    skill_level: str = Field(default="intermediate", pattern="^(beginner|intermediate|advanced)$")
    domain: str = "machine learning"


class ProjectGenerateResponse(BaseModel):
    project_id: str
    status: str


class ProjectStatusResponse(BaseModel):
    project_id: str
    status: str
    progress: float


class ProjectDetailsResponse(BaseModel):
    project_id: str
    title: str
    description: str
    domain: str
    skill_level: str
    milestones: list[dict]
    created_at: str


class FeedbackRequest(BaseModel):
    feedback: str


class FeedbackResponse(BaseModel):
    status: str
    message: str


class GraduationProjectRequest(BaseModel):
    skills: list[str]
    interests: list[str]
    provider: Optional[str] = None
    model: Optional[str] = None


def _generate_project(interests: str, skill_level: str, domain: str) -> dict:
    """توليد مشروع بناءً على اهتمامات الطالب ومستواه."""
    project_id = str(uuid.uuid4())[:8]

    templates = {
        "beginner": {
            "title": f"مشروع تطبيقي: {domain} - مستوى مبتدئ",
            "description": f"مشروع تعليمي يركز على أساسيات {domain} بناءً على اهتماماتك في {interests}.",
            "milestones": [
                {"week": 1, "title": "فهم الأساسيات", "tasks": ["قراءة المفاهيم الأساسية", "تشغيل أمثلة جاهزة"], "status": "pending"},
                {"week": 2, "title": "التطبيق الأول", "tasks": ["بناء نموذج بسيط", "اختبار النتائج"], "status": "pending"},
                {"week": 3, "title": "التحسين والتوثيق", "tasks": ["تحسين الأداء", "كتابة التقرير"], "status": "pending"},
            ],
        },
        "intermediate": {
            "title": f"مشروع متوسط: {domain} التطبيقي",
            "description": f"مشروع عملي في {domain} يدمج {interests} مع تقنيات متقدمة.",
            "milestones": [
                {"week": 1, "title": "التخطيط وجمع البيانات", "tasks": ["تحديد المشكلة", "جمع وتنظيف البيانات"], "status": "pending"},
                {"week": 2, "title": "بناء النموذج", "tasks": ["اختيار الخوارزمية", "التدريب والتقييم"], "status": "pending"},
                {"week": 3, "title": "التحسين", "tasks": ["ضبط المعاملات", "مقارنة النماذج"], "status": "pending"},
                {"week": 4, "title": "النشر والعرض", "tasks": ["بناء واجهة بسيطة", "تحضير العرض التقديمي"], "status": "pending"},
            ],
        },
        "advanced": {
            "title": f"مشروع متقدم: بحث في {domain}",
            "description": f"مشروع بحثي متقدم يجمع بين {interests} وأحدث تقنيات {domain}.",
            "milestones": [
                {"week": 1, "title": "مراجعة الأدبيات", "tasks": ["قراءة الأوراق البحثية", "تحديد الفجوة البحثية"], "status": "pending"},
                {"week": 2, "title": "التصميم التجريبي", "tasks": ["تصميم التجربة", "إعداد البيئة"], "status": "pending"},
                {"week": 3, "title": "التنفيذ", "tasks": ["تنفيذ النموذج", "إجراء التجارب"], "status": "pending"},
                {"week": 4, "title": "التحليل", "tasks": ["تحليل النتائج", "المقارنة مع الأعمال السابقة"], "status": "pending"},
                {"week": 5, "title": "الكتابة والنشر", "tasks": ["كتابة الورقة", "تحضير العرض"], "status": "pending"},
            ],
        },
    }

    template = templates.get(skill_level, templates["intermediate"])
    return {
        "project_id": project_id,
        "title": template["title"],
        "description": template["description"],
        "domain": domain,
        "skill_level": skill_level,
        "interests": interests,
        "milestones": template["milestones"],
        "status": "generated",
        "progress": 0.0,
        "feedback_history": [],
        "created_at": datetime.now(timezone.utc).isoformat(),
    }


@router.post("/generate", response_model=ProjectGenerateResponse)
async def generate_project(req: ProjectGenerateRequest):
    """توليد مشروع جديد بناءً على اهتمامات الطالب."""
    project = _generate_project(req.interests, req.skill_level, req.domain)
    _projects[project["project_id"]] = project
    return ProjectGenerateResponse(project_id=project["project_id"], status="generated")


@router.get("/status/{project_id}", response_model=ProjectStatusResponse)
async def project_status(project_id: str):
    """الحصول على حالة المشروع."""
    project = _projects.get(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return ProjectStatusResponse(
        project_id=project_id,
        status=project["status"],
        progress=project["progress"],
    )


@router.get("/{project_id}", response_model=ProjectDetailsResponse)
async def project_details(project_id: str):
    """تفاصيل المشروع الكاملة."""
    project = _projects.get(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return ProjectDetailsResponse(
        project_id=project_id,
        title=project["title"],
        description=project["description"],
        domain=project["domain"],
        skill_level=project["skill_level"],
        milestones=project["milestones"],
        created_at=project["created_at"],
    )


@router.post("/feedback/{project_id}", response_model=FeedbackResponse)
async def submit_feedback(project_id: str, req: FeedbackRequest):
    """إرسال ملاحظات على المشروع لتحسينه."""
    project = _projects.get(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    project["feedback_history"].append({
        "feedback": req.feedback,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })
    project["status"] = "feedback_received"
    return FeedbackResponse(status="ok", message="Feedback received, project will be refined.")


@router.get("/", response_model=list[ProjectDetailsResponse])
async def list_projects():
    """قائمة جميع المشاريع."""
    return [
        ProjectDetailsResponse(
            project_id=p["project_id"],
            title=p["title"],
            description=p["description"],
            domain=p["domain"],
            skill_level=p["skill_level"],
            milestones=p["milestones"],
            created_at=p["created_at"],
        )
        for p in _projects.values()
    ]


@router.post("/generate-graduation")
async def generate_graduation(req: GraduationProjectRequest):
    from app.services.study_service import _llm_call
    from json import loads as json_loads, JSONDecodeError
    import logging
    
    logger = logging.getLogger(__name__)

    system = "أنت مستشار أكاديمي وخبير في هندسة الذكاء الاصطناعي وتصميم مشاريع التخرج الجامعية."
    user = (
        f"قم بتوليد فكرة مشروع تخرج جامعي متميز ومبتكر وملاءم لمهارات الطالب واهتماماته.\n"
        f"مهارات الطالب: {', '.join(req.skills)}\n"
        f"اهتمامات الطالب: {', '.join(req.interests)}\n\n"
        f"يجب أن تكون خطة المشروع مقسمة على 10 أسابيع عمل واضحة ومفصلة.\n\n"
        f"قم بصياغة النتيجة بتنسيق JSON حصراً بدون أي نصوص إضافية، بالهيكل التالي:\n"
        f"{{\n"
        f'  "title": "عنوان مشروع التخرج المقترح",\n'
        f'  "description": "وصف تفصيلي للمشروع وأهدافه والتقنيات المستخدمة فيه",\n'
        f'  "datasets": ["مجموعة بيانات 1", "مجموعة بيانات 2"],\n'
        f'  "papers": ["ورقة بحثية مقترحة 1", "ورقة بحثية مقترحة 2"],\n'
        f'  "milestones": [\n'
        f'    {{ "week": 1, "title": "إعداد البيئة ومراجعة الأدبيات", "tasks": ["تحديد متمتطلبات النظام", "قراءة الأوراق البحثية"] }},\n'
        f'    ... (حتى الأسبوع 10)\n'
        f'  ]\n'
        f"}}\n"
    )

    try:
        raw_result = await _llm_call(system, user, provider=req.provider, model=req.model)
        cleaned = raw_result.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("\n", 1)[1]
        if cleaned.endswith("```"):
            cleaned = cleaned.rsplit("\n", 1)[0]
        cleaned = cleaned.strip()
        
        result_json = json_loads(cleaned)
        
        proj_id = f"grad-{str(uuid.uuid4())[:8]}"
        project = {
            "project_id": proj_id,
            "title": result_json.get("title", "مشروع تخرج مقترح"),
            "description": result_json.get("description", ""),
            "domain": "Artificial Intelligence",
            "skill_level": "advanced",
            "milestones": result_json.get("milestones", []),
            "datasets": result_json.get("datasets", []),
            "papers": result_json.get("papers", []),
            "created_at": datetime.now(timezone.utc).isoformat(),
            "status": "generated"
        }
        _projects[proj_id] = project
        return project
    except Exception as e:
        logger.error(f"Graduation project generation failed: {e}", exc_info=True)
        fallback_id = f"grad-fallback-{str(uuid.uuid4())[:8]}"
        fallback_project = {
            "project_id": fallback_id,
            "title": "نظام ذكي مقترح للتصنيف والتحليل المستقل",
            "description": "مشروع تخرج مقترح يستخدم تقنيات تعلم الآلة ومعالجة اللغات الطبيعية لمعالجة البيانات وتوليد تصنيفات دقيقة.",
            "domain": "Artificial Intelligence",
            "skill_level": "advanced",
            "datasets": ["m7mdxzx9/masar-dataset", "UCI Machine Learning Repository"],
            "papers": ["Attention Is All You Need (Vaswani et al.)", "An Image is Worth 16x16 Words (Dosovitskiy et al.)"],
            "milestones": [
                {"week": i, "title": f"المرحلة {i}: تطوير واختبار المكونات الأساسية للمشروع", "tasks": [f"تنفيذ مهام المرحلة {i} في التطبيق والتوثيق"]}
                for i in range(1, 11)
            ],
            "created_at": datetime.now(timezone.utc).isoformat(),
            "status": "generated"
        }
        _projects[fallback_id] = fallback_project
        return fallback_project
