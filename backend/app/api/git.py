import subprocess
from pathlib import Path
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/git", tags=["Git"])

REPO_DIR = Path(__file__).resolve().parent.parent.parent


class CommitRequest(BaseModel):
    message: str


class CommitResponse(BaseModel):
    success: bool
    commit_hash: str | None = None
    message: str


class LogEntry(BaseModel):
    commit_hash: str
    author: str
    date: str
    message: str


def _run_git(*args: str) -> str:
    result = subprocess.run(
        ["git", *args],
        capture_output=True,
        encoding="utf-8",
        cwd=REPO_DIR,
    )
    if result.returncode != 0:
        raise HTTPException(status_code=400, detail=result.stderr.strip())
    return result.stdout.strip()


@router.post("/commit", response_model=CommitResponse)
async def git_commit(req: CommitRequest):
    _run_git("add", "-A")
    _run_git("commit", "-m", req.message)
    try:
        commit_hash = _run_git("rev-parse", "HEAD")
    except HTTPException:
        commit_hash = None
    return CommitResponse(success=True, commit_hash=commit_hash, message="Committed successfully")


@router.get("/log", response_model=list[LogEntry])
async def git_log(limit: int = 20):
    try:
        output = _run_git("log", f"--max-count={limit}", "--format=%H|%an|%ai|%s")
    except HTTPException:
        return []
    entries: list[LogEntry] = []
    for line in output.split("\n"):
        if not line.strip():
            continue
        parts = line.split("|", 3)
        if len(parts) == 4:
            entries.append(LogEntry(commit_hash=parts[0], author=parts[1], date=parts[2], message=parts[3]))
    return entries


@router.get("/status")
async def git_status():
    try:
        output = _run_git("status", "--porcelain")
    except HTTPException:
        return {"changed_files": [], "branch": "unknown"}
    branch = _run_git("rev-parse", "--abbrev-ref", "HEAD")
    changed = [line[:3].strip() for line in output.split("\n") if line.strip()]
    return {"changed_files": changed, "branch": branch}


@router.post("/push")
async def git_push():
    try:
        _run_git("push")
        return {"success": True, "message": "Pushed successfully"}
    except HTTPException as e:
        raise HTTPException(status_code=400, detail=f"Push failed: {e.detail}")
