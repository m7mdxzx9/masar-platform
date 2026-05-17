import os
import logging
from typing import Optional

from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Query
from pydantic import BaseModel, Field

from app.core.config import settings
from app.services.rag.rag_service import (
    upload_and_process,
    upload_text_and_process,
    search_knowledge,
    delete_document,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/knowledge", tags=["Knowledge Base & RAG"])


class TextUploadRequest(BaseModel):
    title: str = Field(..., max_length=500)
    content: str = Field(..., min_length=1)
    doc_type: str = Field(default="text")
    metadata: Optional[dict] = None


class SearchRequest(BaseModel):
    query: str = Field(..., min_length=1)
    top_k: int = Field(default=5, ge=1, le=50)


@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    title: str = Form(...),
    doc_type: str = Form(default="auto"),
    metadata: Optional[str] = Form(default=None),
):
    import json

    if doc_type == "auto":
        ext = os.path.splitext(file.filename or "")[1].lower().lstrip(".")
        doc_type = ext if ext in ("pdf", "txt", "md", "csv") else "text"

    upload_dir = settings.upload_dir
    os.makedirs(upload_dir, exist_ok=True)
    filepath = os.path.join(upload_dir, file.filename or "uploaded_file")

    try:
        with open(filepath, "wb") as f:
            content = await file.read()
            f.write(content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"File save error: {str(e)}")

    meta_dict = {}
    if metadata:
        try:
            meta_dict = json.loads(metadata)
        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="Invalid metadata JSON")

    try:
        result = await upload_and_process(
            filepath=filepath,
            title=title,
            source_file=file.filename or "uploaded_file",
            doc_type=doc_type,
            metadata=meta_dict,
        )
        return {"success": True, **result}
    except Exception as e:
        logger.error(f"Upload processing error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/upload-text")
async def upload_text(request: TextUploadRequest):
    try:
        result = await upload_text_and_process(
            text=request.content,
            title=request.title,
            doc_type=request.doc_type,
            metadata=request.metadata,
        )
        return {"success": True, **result}
    except Exception as e:
        logger.error(f"Text upload error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/search")
async def search(request: SearchRequest):
    try:
        results = await search_knowledge(query=request.query, top_k=request.top_k)
        return {
            "query": request.query,
            "top_k": request.top_k,
            "results_count": len(results),
            "results": results,
        }
    except Exception as e:
        logger.error(f"Search error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/document/{source_file:path}")
async def remove_document(source_file: str):
    try:
        result = await delete_document(source_file)
        return {"success": True, **result}
    except Exception as e:
        logger.error(f"Delete error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/info")
def knowledge_info():
    from app.core.config import settings

    return {
        "vector_store_backend": settings.vector_store_backend,
        "embedding_provider": settings.embedding_provider,
        "embedding_model": settings.effective_embedding_model,
        "embedding_dimension": settings.embedding_dimension,
        "chunk_size": settings.rag_chunk_size,
        "chunk_overlap": settings.rag_chunk_overlap,
        "default_top_k": settings.rag_top_k,
    }
