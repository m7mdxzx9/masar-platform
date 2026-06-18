import json
import os
import io
import logging
from datetime import datetime
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Request
from fastapi.responses import JSONResponse, FileResponse
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from urllib.parse import urlparse

from app.core.config import settings
from app.core.database import get_db
from app.models.models import Note, Subject

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/drive", tags=["Google Drive"])

GOOGLE_TOKEN_PATH = Path(__file__).resolve().parent.parent.parent / "drive_token.json"


class AuthUrlResponse(BaseModel):
    url: str


class TokenData(BaseModel):
    code: str


class DriveStatus(BaseModel):
    linked: bool
    folder_id: Optional[str] = None


class DriveFile(BaseModel):
    id: str
    name: str
    mimeType: str
    modifiedTime: str
    size: Optional[str] = None


class BackupInfo(BaseModel):
    filename: str
    created_at: str
    size: int
    file_id: str


class DriveFolderList(BaseModel):
    files: list[DriveFile]
    path: str


class DriveExportRequest(BaseModel):
    scope: str = Field(default="all", description="all, notes, subjects, settings")


def _get_drive_service():
    from google.oauth2.credentials import Credentials
    from googleapiclient.discovery import build

    if not GOOGLE_TOKEN_PATH.exists():
        raise HTTPException(status_code=400, detail="Google Drive not linked")
    creds = Credentials.from_authorized_user_file(str(GOOGLE_TOKEN_PATH))
    return build("drive", "v3", credentials=creds)


def _save_creds(creds):
    GOOGLE_TOKEN_PATH.write_text(creds.to_json())


def _clear_creds():
    if GOOGLE_TOKEN_PATH.exists():
        GOOGLE_TOKEN_PATH.unlink()


@router.get("/auth-url", response_model=AuthUrlResponse)
async def get_auth_url(request: Request, redirect_uri: Optional[str] = None):
    from google_auth_oauthlib.flow import Flow

    r_uri = redirect_uri
    if not r_uri:
        ref_origin = request.headers.get("origin") or request.headers.get("referer")
        if ref_origin:
            try:
                parsed = urlparse(ref_origin)
                r_uri = f"{parsed.scheme}://{parsed.netloc}/drive/callback"
            except Exception:
                pass
    if not r_uri:
        r_uri = settings.google_drive_redirect_uri

    flow = Flow.from_client_config(
        {
            "web": {
                "client_id": settings.google_drive_client_id,
                "client_secret": settings.google_drive_client_secret,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "redirect_uris": [r_uri],
            }
        },
        scopes=["https://www.googleapis.com/auth/drive.file"],
        redirect_uri=r_uri,
    )
    auth_url, _ = flow.authorization_url(prompt="consent")
    return AuthUrlResponse(url=auth_url)


@router.post("/auth-callback")
async def auth_callback(request: Request, data: TokenData, redirect_uri: Optional[str] = None):
    from google_auth_oauthlib.flow import Flow

    r_uri = redirect_uri
    if not r_uri:
        ref_origin = request.headers.get("origin") or request.headers.get("referer")
        if ref_origin:
            try:
                parsed = urlparse(ref_origin)
                r_uri = f"{parsed.scheme}://{parsed.netloc}/drive/callback"
            except Exception:
                pass
    if not r_uri:
        r_uri = settings.google_drive_redirect_uri

    flow = Flow.from_client_config(
        {
            "web": {
                "client_id": settings.google_drive_client_id,
                "client_secret": settings.google_drive_client_secret,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "redirect_uris": [r_uri],
            }
        },
        scopes=["https://www.googleapis.com/auth/drive.file"],
        redirect_uri=r_uri,
    )
    flow.fetch_token(code=data.code)
    _save_creds(flow.credentials)
    return {"success": True, "message": "Google Drive linked successfully"}


@router.get("/status", response_model=DriveStatus)
async def drive_status():
    linked = GOOGLE_TOKEN_PATH.exists()
    folder_id = None
    if linked:
        try:
            service = _get_drive_service()
            folder_id = _ensure_masar_folder(service)
        except Exception:
            linked = False
            _clear_creds()
    return DriveStatus(linked=linked, folder_id=folder_id)


@router.post("/unlink")
async def unlink_drive():
    _clear_creds()
    return {"success": True, "message": "Google Drive unlinked"}


def _ensure_masar_folder(service) -> str:
    query = "name='Masar' and mimeType='application/vnd.google-apps.folder' and trashed=false"
    result = service.files().list(q=query, spaces="drive", fields="files(id)").execute()
    files = result.get("files", [])
    if files:
        root_id = files[0]["id"]
    else:
        folder = service.files().create(
            body={"name": "Masar", "mimeType": "application/vnd.google-apps.folder"},
            fields="id",
        ).execute()
        root_id = folder["id"]

    subfolders = ["Notes", "Subjects", "Code", "Flashcards", "Goals", "Backups"]
    for name in subfolders:
        q = f"name='{name}' and mimeType='application/vnd.google-apps.folder' and '{root_id}' in parents and trashed=false"
        existing = service.files().list(q=q, spaces="drive", fields="files(id)").execute().get("files", [])
        if not existing:
            service.files().create(
                body={"name": name, "mimeType": "application/vnd.google-apps.folder", "parents": [root_id]},
                fields="id",
            ).execute()
    return root_id


@router.get("/files")
async def list_files(folder_id: Optional[str] = None):
    service = _get_drive_service()
    if not folder_id:
        folder_id = _ensure_masar_folder(service)
    q = f"'{folder_id}' in parents and trashed=false"
    result = service.files().list(
        q=q, spaces="drive",
        fields="files(id, name, mimeType, size, modifiedTime)",
        orderBy="folder,name",
    ).execute()
    files = []
    for f in result.get("files", []):
        files.append(DriveFile(
            id=f["id"],
            name=f["name"],
            mime_type=f["mimeType"],
            size=int(f.get("size", 0)) if f.get("size") else None,
            modified_time=f.get("modifiedTime"),
            is_folder=f["mimeType"] == "application/vnd.google-apps.folder",
        ))
    return {"files": files, "folder_id": folder_id}


@router.get("/folders")
async def list_folders():
    service = _get_drive_service()
    root_id = _ensure_masar_folder(service)
    q = f"mimeType='application/vnd.google-apps.folder' and trashed=false"
    result = service.files().list(
        q=q, spaces="drive",
        fields="files(id, name, parents)",
    ).execute()
    folders = [{"id": root_id, "name": "Masar", "parents": []}]
    for f in result.get("files", []):
        folders.append({"id": f["id"], "name": f["name"], "parents": f.get("parents", [])})
    return {"folders": folders, "root_id": root_id}


@router.post("/backup")
async def backup_to_drive(db: AsyncSession = Depends(get_db)):
    service = _get_drive_service()
    root_id = _ensure_masar_folder(service)

    q = f"name='Backups' and mimeType='application/vnd.google-apps.folder' and '{root_id}' in parents and trashed=false"
    folders = service.files().list(q=q, fields="files(id)").execute().get("files", [])
    backup_folder_id = folders[0]["id"] if folders else root_id

    data = {"subjects": [], "notes": []}
    for model_cls, name in [(Subject, "subjects"), (Note, "notes")]:
        result = await db.execute(select(model_cls))
        for row in result.scalars().all():
            d = {c.name: getattr(row, c.name) for c in row.__table__.columns}
            for k, v in d.items():
                if isinstance(v, datetime):
                    d[k] = v.isoformat()
            data[name].append(d)

    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"backup_{ts}.json"
    file_bytes = json.dumps(data, ensure_ascii=False, indent=2).encode("utf-8")

    from googleapiclient.http import MediaIoBaseUpload
    media = MediaIoBaseUpload(io.BytesIO(file_bytes), mimetype="application/json", resumable=True)
    service.files().create(
        body={"name": filename, "parents": [backup_folder_id]},
        media_body=media,
    ).execute()

    return {"success": True, "filename": filename}


@router.get("/backups")
async def list_drive_backups():
    service = _get_drive_service()
    root_id = _ensure_masar_folder(service)

    q = f"name='Backups' and mimeType='application/vnd.google-apps.folder' and '{root_id}' in parents and trashed=false"
    folders = service.files().list(q=q, fields="files(id)").execute().get("files", [])
    if not folders:
        return {"backups": []}
    backup_folder_id = folders[0]["id"]

    q = f"'{backup_folder_id}' in parents and name contains 'backup_' and trashed=false"
    result = service.files().list(
        q=q, spaces="drive",
        fields="files(id, name, size, modifiedTime)",
        orderBy="modifiedTime desc",
    ).execute()
    return {"backups": result.get("files", [])}


@router.post("/restore/{file_id}")
async def restore_from_drive(file_id: str, db: AsyncSession = Depends(get_db)):
    service = _get_drive_service()
    request = service.files().get_media(fileId=file_id)
    content = request.execute()
    try:
        data = json.loads(content)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid backup file")

    from sqlalchemy import text
    for table in ["subjects", "notes"]:
        if table in data:
            await db.execute(text(f"DELETE FROM {table}"))
            await db.commit()

    for model_cls, name in [(Subject, "subjects"), (Note, "notes")]:
        if name not in data:
            continue
        for row_data in data[name]:
            if "id" in row_data:
                del row_data["id"]
            for k, v in row_data.items():
                if isinstance(v, str) and "T" in v:
                    try:
                        row_data[k] = datetime.fromisoformat(v)
                    except (ValueError, TypeError):
                        pass
            instance = model_cls(**row_data)
            db.add(instance)
        await db.commit()

    return {"success": True, "message": "Backup restored from Google Drive"}


@router.post("/export")
async def export_to_drive(req: DriveExportRequest, db: AsyncSession = Depends(get_db)):
    service = _get_drive_service()
    root_id = _ensure_masar_folder(service)

    data = {}
    if req.scope in ("all", "notes"):
        result = await db.execute(select(Note))
        data["notes"] = [{"id": n.id, "title": n.title, "content": n.content, "created_at": str(n.created_at)} for n in result.scalars().all()]
    if req.scope in ("all", "subjects"):
        result = await db.execute(select(Subject))
        data["subjects"] = [{"id": s.id, "name": s.name, "description": s.description} for s in result.scalars().all()]
    if req.scope == "all":
        data["exported_at"] = datetime.now().isoformat()
        data["version"] = settings.app_version

    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"masar_export_{req.scope}_{ts}.json"
    file_bytes = json.dumps(data, ensure_ascii=False, indent=2).encode("utf-8")

    from googleapiclient.http import MediaIoBaseUpload
    media = MediaIoBaseUpload(io.BytesIO(file_bytes), mimetype="application/json", resumable=True)
    service.files().create(
        body={"name": filename, "parents": [root_id]},
        media_body=media,
    ).execute()

    return {"success": True, "filename": filename}


@router.post("/sync-notes")
async def sync_notes_to_drive(db: AsyncSession = Depends(get_db)):
    service = _get_drive_service()
    root_id = _ensure_masar_folder(service)

    q = f"name='Notes' and mimeType='application/vnd.google-apps.folder' and '{root_id}' in parents and trashed=false"
    folders = service.files().list(q=q, fields="files(id)").execute().get("files", [])
    notes_folder_id = folders[0]["id"] if folders else root_id

    result = await db.execute(select(Note))
    synced = 0
    for note in result.scalars().all():
        note_filename = f"{note.title}.md"
        content = f"# {note.title}\n\n{note.content or ''}"
        file_bytes = content.encode("utf-8")

        q = f"name='{note_filename}' and '{notes_folder_id}' in parents and trashed=false"
        existing = service.files().list(q=q, fields="files(id)").execute().get("files", [])
        from googleapiclient.http import MediaIoBaseUpload
        media = MediaIoBaseUpload(io.BytesIO(file_bytes), mimetype="text/markdown", resumable=True)
        if existing:
            service.files().update(fileId=existing[0]["id"], media_body=media).execute()
        else:
            service.files().create(
                body={"name": note_filename, "parents": [notes_folder_id]},
                media_body=media,
            ).execute()
        synced += 1

    return {"success": True, "synced": synced}


@router.post("/upload")
async def upload_to_drive(file: UploadFile = File(...), folder: str = ""):
    service = _get_drive_service()
    root_id = _ensure_masar_folder(service)
    parent_id = root_id
    if folder:
        q = f"name='{folder}' and mimeType='application/vnd.google-apps.folder' and '{root_id}' in parents and trashed=false"
        folders = service.files().list(q=q, fields="files(id)").execute().get("files", [])
        if folders:
            parent_id = folders[0]["id"]

    content = await file.read()
    from googleapiclient.http import MediaIoBaseUpload
    media = MediaIoBaseUpload(io.BytesIO(content), mimetype=file.content_type or "application/octet-stream", resumable=True)
    uploaded = service.files().create(
        body={"name": file.filename, "parents": [parent_id]},
        media_body=media,
    ).execute()

    return {"success": True, "file_id": uploaded["id"], "name": file.filename}


@router.get("/download/{file_id}")
async def download_from_drive(file_id: str):
    service = _get_drive_service()
    file_meta = service.files().get(fileId=file_id, fields="name").execute()
    request = service.files().get_media(fileId=file_id)
    content = request.execute()
    return FileResponse(
        io.BytesIO(content),
        media_type="application/octet-stream",
        filename=file_meta["name"],
    )


@router.post("/ai-summarize/{file_id}")
async def ai_summarize_file(file_id: str):
    from app.services.agents.llm_factory import create_chat_llm_with_fallback

    service = _get_drive_service()
    file_meta = service.files().get(fileId=file_id, fields="name, mimeType").execute()
    request = service.files().get_media(fileId=file_id)
    content = request.execute()

    text = content.decode("utf-8", errors="replace")[:10000]

    llm = create_chat_llm_with_fallback(temperature=0.3, max_tokens=1024, streaming=False)
    response = await llm.ainvoke([
        {"role": "system", "content": "You are a summarization assistant. Summarize the following document in Arabic. Include key points."},
        {"role": "user", "content": f"File: {file_meta['name']}\n\n{text}"},
    ])
    summary = response.content.strip()

    root_id = _ensure_masar_folder(service)
    summary_filename = f"summary_{file_meta['name']}.md"
    summary_content = f"# ملخص: {file_meta['name']}\n\n{summary}\n\n---\n_Generated by Masar AI_"
    from googleapiclient.http import MediaIoBaseUpload
    media = MediaIoBaseUpload(io.BytesIO(summary_content.encode("utf-8")), mimetype="text/markdown", resumable=True)
    service.files().create(
        body={"name": summary_filename, "parents": [root_id]},
        media_body=media,
    ).execute()

    return {"success": True, "summary": summary}


@router.post("/ai-quiz/{file_id}")
async def ai_quiz_from_file(file_id: str):
    from app.services.agents.llm_factory import create_chat_llm_with_fallback

    service = _get_drive_service()
    file_meta = service.files().get(fileId=file_id, fields="name, mimeType").execute()
    request = service.files().get_media(fileId=file_id)
    content = request.execute()
    text = content.decode("utf-8", errors="replace")[:10000]

    llm = create_chat_llm_with_fallback(temperature=0.3, max_tokens=2048, streaming=False)
    response = await llm.ainvoke([
        {"role": "system", "content": "أنت مساعد توليد اختبارات. قم بتوليد 5 أسئلة اختيار من متعدد من النص التالي بالعربية. كل سؤال له 4 خيارات وإجابة صحيحة."},
        {"role": "user", "content": f"File: {file_meta['name']}\n\n{text}"},
    ])
    quiz = response.content.strip()

    root_id = _ensure_masar_folder(service)
    quiz_filename = f"quiz_{file_meta['name']}.md"
    from googleapiclient.http import MediaIoBaseUpload
    media = MediaIoBaseUpload(io.BytesIO(quiz.encode("utf-8")), mimetype="text/markdown", resumable=True)
    service.files().create(
        body={"name": quiz_filename, "parents": [root_id]},
        media_body=media,
    ).execute()

    return {"success": True, "quiz": quiz}
