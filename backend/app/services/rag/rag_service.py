import os
import logging
from typing import Optional

from app.core.config import settings
from app.services.rag.document_processor import load_file, load_text, chunk_documents
from app.services.rag.pgvector_store import (
    store_chunks_pgvector,
    search_pgvector,
    delete_document_pgvector,
)
from app.services.rag.chromadb_store import (
    store_chunks_chromadb,
    search_chromadb,
    delete_document_chromadb,
)

logger = logging.getLogger(__name__)


async def upload_and_process(
    filepath: str,
    title: str,
    source_file: str,
    doc_type: str = "pdf",
    metadata: Optional[dict] = None,
) -> dict:
    documents = load_file(filepath)
    chunks = chunk_documents(documents)

    if settings.vector_store_backend == "pgvector":
        ids = await store_chunks_pgvector(
            title=title,
            chunks=chunks,
            source_file=source_file,
            doc_type=doc_type,
            metadata=metadata,
        )
    else:
        ids = await store_chunks_chromadb(
            title=title,
            chunks=chunks,
            source_file=source_file,
            doc_type=doc_type,
            metadata=metadata,
        )

    return {
        "title": title,
        "source_file": source_file,
        "doc_type": doc_type,
        "chunks_count": len(chunks),
        "chunk_ids": ids,
        "backend": settings.vector_store_backend,
    }


async def upload_text_and_process(
    text: str,
    title: str,
    doc_type: str = "text",
    metadata: Optional[dict] = None,
) -> dict:
    documents = load_text(text, title)
    chunks = chunk_documents(documents)

    if settings.vector_store_backend == "pgvector":
        ids = await store_chunks_pgvector(
            title=title,
            chunks=chunks,
            source_file=title,
            doc_type=doc_type,
            metadata=metadata,
        )
    else:
        ids = await store_chunks_chromadb(
            title=title,
            chunks=chunks,
            source_file=title,
            doc_type=doc_type,
            metadata=metadata,
        )

    return {
        "title": title,
        "source_file": title,
        "doc_type": doc_type,
        "chunks_count": len(chunks),
        "chunk_ids": ids,
        "backend": settings.vector_store_backend,
    }


async def search_knowledge(
    query: str,
    top_k: Optional[int] = None,
) -> list[dict]:
    k = top_k or settings.rag_top_k

    if settings.vector_store_backend == "pgvector":
        return await search_pgvector(query, top_k=k)
    else:
        return await search_chromadb(query, top_k=k)


async def delete_document(source_file: str) -> dict:
    if settings.vector_store_backend == "pgvector":
        count = await delete_document_pgvector(source_file)
    else:
        count = await delete_document_chromadb(source_file)

    return {
        "source_file": source_file,
        "deleted_chunks": count,
        "backend": settings.vector_store_backend,
    }
