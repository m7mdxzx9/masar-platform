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
