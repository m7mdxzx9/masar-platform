import json
import shutil
from datetime import datetime
from pathlib import Path
from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import Depends
from app.core.database import get_db
from app.models.models import Subject, Note, Course, Goal, FocusSession

router = APIRouter(prefix="/backup", tags=["Backup"])

BACKUP_DIR = Path(__file__).resolve().parent.parent.parent / "backups"
BACKUP_DIR.mkdir(exist_ok=True)


class BackupInfo(BaseModel):
    filename: str
    date: str
    size_bytes: int


@router.post("/create", response_model=BackupInfo)
async def create_backup(db: AsyncSession = Depends(get_db)):
    data: dict[str, list] = {}
    for model_cls, name in [
        (Subject, "subjects"),
        (Note, "notes"),
        (Course, "courses"),
        (Goal, "goals"),
    ]:
        result = await db.execute(select(model_cls))
        rows = result.scalars().all()
        serialized = []
        for row in rows:
            d = {c.name: getattr(row, c.name) for c in row.__table__.columns}
            for k, v in d.items():
                if isinstance(v, datetime):
                    d[k] = v.isoformat()
            serialized.append(d)
        data[name] = serialized

    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"backup_{ts}.json"
    filepath = BACKUP_DIR / filename
    filepath.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")

    return BackupInfo(filename=filename, date=ts, size_bytes=filepath.stat().st_size)


@router.get("/list", response_model=list[BackupInfo])
async def list_backups():
    if not BACKUP_DIR.exists():
        return []
    backups: list[BackupInfo] = []
    for f in sorted(BACKUP_DIR.iterdir(), key=lambda p: p.name, reverse=True):
        if f.suffix == ".json":
            date_part = f.stem.replace("backup_", "")
            backups.append(BackupInfo(filename=f.name, date=date_part, size_bytes=f.stat().st_size))
    return backups


@router.get("/download/{filename}")
async def download_backup(filename: str):
    filepath = BACKUP_DIR / filename
    if not filepath.exists() or not filepath.parent.samefile(BACKUP_DIR):
        raise HTTPException(status_code=404, detail="Backup not found")
    from fastapi.responses import FileResponse
    return FileResponse(filepath, media_type="application/json", filename=filename)


@router.post("/restore")
async def upload_and_restore(file: UploadFile = File(...), db: AsyncSession = Depends(get_db)):
    if not file.filename or not file.filename.endswith(".json"):
        raise HTTPException(status_code=400, detail="Please upload a JSON file")
    content = await file.read()
    try:
        data = json.loads(content.decode("utf-8"))
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON file or encoding")

    from sqlalchemy import text
    for table in ["subjects", "notes", "courses", "goals"]:
        if table in data:
            await db.execute(text(f"DELETE FROM {table}"))
            await db.commit()

    for model_cls, name in [
        (Subject, "subjects"),
        (Note, "notes"),
        (Course, "courses"),
        (Goal, "goals"),
    ]:
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

    return {"success": True, "message": "Backup restored successfully"}
