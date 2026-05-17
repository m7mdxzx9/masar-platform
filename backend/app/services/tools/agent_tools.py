from langchain_core.tools import tool
from sqlalchemy import select, func
from app.models.models import Course, Progress, KnowledgeDocument, CodeSnippet
from app.core.database import async_session_factory
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)


@tool
async def search_notes(query: str) -> str:
    """Search the knowledge base for notes and documents matching the query using vector similarity. Returns relevant content."""
    try:
        if settings.vector_store_backend == "pgvector":
            from app.services.rag.pgvector_store import search_pgvector
            results = await search_pgvector(query, top_k=5)
            if not results:
                return f"No notes found matching '{query}'."
            entries = []
            for r in results:
                entries.append(
                    f"[{r['title']}] (chunk {r['chunk_index']}, distance: {r.get('distance', 'N/A')}):\n{r['content'][:500]}"
                )
            return "\n\n---\n\n".join(entries)
        else:
            from app.services.rag.chromadb_store import search_chromadb
            results = await search_chromadb(query, top_k=5)
            if not results:
                return f"No notes found matching '{query}'."
            entries = []
            for r in results:
                content = r.get("content", "")
                meta = r.get("metadata", {})
                entries.append(
                    f"[{meta.get('title', 'untitled')}] (chunk {meta.get('chunk_index', 0)}):\n{content[:500]}"
                )
            return "\n\n---\n\n".join(entries)
    except Exception as e:
        logger.error(f"search_notes error: {e}")
        return f"Error searching notes: {str(e)}"


@tool
async def add_to_knowledge_base(title: str, content: str, doc_type: str = "note") -> str:
    """Add a note or content to the knowledge base for future retrieval."""
    try:
        from app.services.rag.rag_service import upload_text_and_process
        result = await upload_text_and_process(
            text=content,
            title=title,
            doc_type=doc_type,
            metadata={"source": "agent_tool"},
        )
        return f"Successfully added '{title}' to the knowledge base ({result['chunks_count']} chunks stored)."
    except Exception as e:
        logger.error(f"add_to_knowledge_base error: {e}")
        return f"Error adding to knowledge base: {str(e)}"


@tool
async def show_learning_progress() -> str:
    """Show the user's learning progress across all courses, including completion percentages and scores."""
    try:
        async with async_session_factory() as session:
            courses_stmt = select(Course)
            courses_result = await session.execute(courses_stmt)
            courses = courses_result.scalars().all()

            if not courses:
                return "No courses found. Start by exploring available courses!"

            lines = ["**Learning Progress:**\n"]
            for course in courses:
                progress_stmt = select(Progress).where(Progress.course_id == course.id)
                progress_result = await session.execute(progress_stmt)
                progress_records = progress_result.scalars().all()

                if progress_records:
                    avg_completion = sum(p.completion_percentage for p in progress_records) / len(
                        progress_records
                    )
                    avg_score = sum(p.score for p in progress_records) / len(progress_records)
                    completed = sum(1 for p in progress_records if p.is_completed)
                    lines.append(
                        f"- **{course.title}**: {avg_completion:.1f}% complete, "
                        f"avg score {avg_score:.0f}, {completed}/{len(progress_records)} modules done"
                    )
                else:
                    lines.append(f"- **{course.title}**: Not started yet")

            total_modules = sum(len(course.progress_records) for course in courses)
            lines.append(f"\nTotal modules tracked: {total_modules}")
            return "\n".join(lines)
    except Exception as e:
        logger.error(f"show_learning_progress error: {e}")
        return f"Error retrieving progress: {str(e)}"


@tool
async def search_code_snippets(query: str, language: str = "python") -> str:
    """Search saved code snippets by title or content. Useful for finding previously written code."""
    try:
        async with async_session_factory() as session:
            stmt = (
                select(CodeSnippet)
                .where(
                    (CodeSnippet.title.ilike(f"%{query}%"))
                    | (CodeSnippet.code.ilike(f"%{query}%"))
                )
                .where(CodeSnippet.language == language)
                .limit(5)
            )
            result = await session.execute(stmt)
            snippets = result.scalars().all()
            if not snippets:
                return f"No code snippets found matching '{query}' in {language}."
            entries = []
            for s in snippets:
                entries.append(f"**{s.title}** (lab: {s.lab_id or 'none'}):\n```{s.language}\n{s.code[:400]}\n```")
            return "\n\n".join(entries)
    except Exception as e:
        logger.error(f"search_code_snippets error: {e}")
        return f"Error searching code snippets: {str(e)}"


@tool
async def list_courses(category: str = "") -> str:
    """List available courses, optionally filtered by category."""
    try:
        async with async_session_factory() as session:
            stmt = select(Course)
            if category:
                stmt = stmt.where(Course.category == category)
            stmt = stmt.limit(20)
            result = await session.execute(stmt)
            courses = result.scalars().all()
            if not courses:
                return "No courses found."
            lines = []
            for c in courses:
                lines.append(f"- **{c.title}** (category: {c.category}, difficulty: {c.difficulty}/5)")
            return "\n".join(lines)
    except Exception as e:
        logger.error(f"list_courses error: {e}")
        return f"Error listing courses: {str(e)}"


ALL_TOOLS = [search_notes, add_to_knowledge_base, show_learning_progress, search_code_snippets, list_courses]
