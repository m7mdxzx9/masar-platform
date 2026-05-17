import json
import logging
from typing import Optional

import chromadb

from app.core.config import settings
from app.services.agents.embedding_factory import embed_text, embed_documents

logger = logging.getLogger(__name__)

_chroma_client = None
_collection = None


def _get_chroma_client():
    global _chroma_client
    if _chroma_client is None:
        _chroma_client = chromadb.HttpClient(
            host=settings.chroma_host,
            port=settings.chroma_port,
        )
    return _chroma_client


def _get_collection():
    global _collection
    if _collection is None:
        client = _get_chroma_client()
        _collection = client.get_or_create_collection(
            name=settings.chroma_collection_name,
            metadata={"hnsw:space": "cosine"},
        )
    return _collection


async def store_chunks_chromadb(
    title: str,
    chunks: list[str],
    source_file: Optional[str] = None,
    doc_type: str = "text",
    metadata: Optional[dict] = None,
) -> list[str]:
    collection = _get_collection()
    embeddings = await embed_documents(chunks)

    ids = []
    for idx, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
        chunk_id = f"{source_file or title}::{idx}"
        ids.append(chunk_id)
        collection.upsert(
            ids=[chunk_id],
            documents=[chunk],
            embeddings=[embedding],
            metadatas=[
                {
                    "title": title,
                    "source_file": source_file or "",
                    "doc_type": doc_type,
                    "chunk_index": idx,
                    **(metadata or {}),
                }
            ],
        )
    logger.info(f"Stored {len(chunks)} chunks for '{title}' in ChromaDB")
    return ids


async def search_chromadb(
    query: str,
    top_k: int = 5,
) -> list[dict]:
    collection = _get_collection()
    query_embedding = await embed_text(query)

    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=top_k,
        include=["documents", "metadatas", "distances"],
    )

    documents = []
    if results and results["ids"] and results["ids"][0]:
        for i, doc_id in enumerate(results["ids"][0]):
            documents.append(
                {
                    "id": doc_id,
                    "content": results["documents"][0][i] if results["documents"] else "",
                    "metadata": results["metadatas"][0][i] if results["metadatas"] else {},
                    "distance": results["distances"][0][i] if results["distances"] else None,
                }
            )
    return documents


async def delete_document_chromadb(source_file: str) -> int:
    collection = _get_collection()
    results = collection.get(
        where={"source_file": source_file},
    )
    ids = results.get("ids", [])
    if ids:
        collection.delete(ids=ids)
    logger.info(f"Deleted {len(ids)} chunks for source '{source_file}' from ChromaDB")
    return len(ids)
