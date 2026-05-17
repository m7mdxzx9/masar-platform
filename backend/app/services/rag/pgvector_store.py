import json
import logging
from typing import Optional

from sqlalchemy import select, delete, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import async_session_factory
from app.models.models import KnowledgeDocument
from app.services.agents.embedding_factory import embed_text, embed_documents

logger = logging.getLogger(__name__)


async def store_chunks_pgvector(
    title: str,
    chunks: list[str],
    source_file: Optional[str] = None,
    doc_type: str = "text",
    metadata: Optional[dict] = None,
) -> list[int]:
    embeddings = await embed_documents(chunks)

    ids = []
    async with async_session_factory() as session:
        for idx, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
            doc = KnowledgeDocument(
                title=title,
                source_file=source_file,
                doc_type=doc_type,
                chunk_index=idx,
                content=chunk,
                metadata_=metadata or {},
            )
            session.add(doc)
            await session.flush()
            doc_id = doc.id
            ids.append(doc_id)

            await session.execute(
                text("UPDATE knowledge_documents SET embedding = :emb WHERE id = :doc_id"),
                {"emb": json.dumps(embedding), "doc_id": doc_id},
            )

        await session.commit()
    logger.info(f"Stored {len(chunks)} chunks for '{title}' in pgvector")
    return ids


async def search_pgvector(
    query: str,
    top_k: int = 5,
) -> list[dict]:
    query_embedding = await embed_text(query)
    embedding_json = json.dumps(query_embedding)

    async with async_session_factory() as session:
        stmt = text(
            """
            SELECT id, title, source_file, doc_type, chunk_index, content, metadata,
                   embedding <=> (:emb_str)::vector AS distance
            FROM knowledge_documents
            WHERE embedding IS NOT NULL
            ORDER BY embedding <=> (:emb_str)::vector
            LIMIT :top_k
            """
        )
        result = await session.execute(
            stmt,
            {"emb_str": embedding_json, "top_k": top_k},
        )
        rows = result.fetchall()
        results = []
        for row in rows:
            results.append(
                {
                    "id": row[0],
                    "title": row[1],
                    "source_file": row[2],
                    "doc_type": row[3],
                    "chunk_index": row[4],
                    "content": row[5],
                    "metadata": row[6],
                    "distance": float(row[7]) if row[7] is not None else None,
                }
            )
    return results


async def delete_document_pgvector(source_file: str) -> int:
    async with async_session_factory() as session:
        stmt = delete(KnowledgeDocument).where(KnowledgeDocument.source_file == source_file)
        result = await session.execute(stmt)
        await session.commit()
    logger.info(f"Deleted {result.rowcount} chunks for source '{source_file}'")
    return result.rowcount
