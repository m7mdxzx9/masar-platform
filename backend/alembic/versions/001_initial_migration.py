"""initial_migration

Revision ID: 001
Revises: 
Create Date: 2026-05-10

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")

    op.create_table(
        "courses",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("title", sa.String(300), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("category", sa.String(80), server_default="general"),
        sa.Column("difficulty", sa.Integer(), server_default="1"),
        sa.Column("modules", JSONB, server_default="[]"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_courses_id", "courses", ["id"])
    op.create_index("ix_courses_title", "courses", ["title"])
    op.create_index("ix_courses_category", "courses", ["category"])

    op.create_table(
        "progress",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("course_id", sa.Integer(), sa.ForeignKey("courses.id", ondelete="CASCADE"), nullable=False),
        sa.Column("module_id", sa.String(100), nullable=False),
        sa.Column("completion_percentage", sa.Float(), server_default="0.0"),
        sa.Column("score", sa.Integer(), server_default="0"),
        sa.Column("is_completed", sa.Boolean(), server_default=sa.text("false")),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_progress_id", "progress", ["id"])
    op.create_index("ix_progress_course_module", "progress", ["course_id", "module_id"])

    op.create_table(
        "code_snippets",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("lab_id", sa.String(100), nullable=True),
        sa.Column("title", sa.String(300), nullable=False),
        sa.Column("code", sa.Text(), nullable=False),
        sa.Column("language", sa.String(30), server_default="python"),
        sa.Column("tags", JSONB, server_default="[]"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_code_snippets_id", "code_snippets", ["id"])
    op.create_index("ix_code_snippets_lab_id", "code_snippets", ["lab_id"])

    op.create_table(
        "knowledge_documents",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("title", sa.String(500), nullable=False),
        sa.Column("source_file", sa.String(500), nullable=True),
        sa.Column("doc_type", sa.String(50), server_default="text"),
        sa.Column("chunk_index", sa.Integer(), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("embedding", sa.Text(), nullable=True),
        sa.Column("metadata", JSONB, server_default="{}"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )
    op.create_index("ix_knowledge_documents_id", "knowledge_documents", ["id"])
    op.create_index("ix_knowledge_doc_source", "knowledge_documents", ["source_file"])
    op.create_index("ix_knowledge_doc_type", "knowledge_documents", ["doc_type"])

    op.execute("ALTER TABLE knowledge_documents ALTER COLUMN embedding TYPE vector(768) USING embedding::vector")

    op.create_table(
        "challenges",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("challenge_id", sa.String(50), nullable=False),
        sa.Column("title", sa.String(300), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("category", sa.String(80), server_default="general"),
        sa.Column("difficulty", sa.String(20), server_default="easy"),
        sa.Column("points", sa.Integer(), server_default="100"),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true")),
        sa.Column("word_list", JSONB, server_default="[]"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )
    op.create_index("ix_challenges_id", "challenges", ["id"])
    op.create_index("ix_challenges_challenge_id", "challenges", ["challenge_id"], unique=True)
    op.create_index("ix_challenges_category", "challenges", ["category"])


def downgrade() -> None:
    op.drop_table("challenges")
    op.drop_table("knowledge_documents")
    op.drop_table("code_snippets")
    op.drop_table("progress")
    op.drop_table("courses")
    op.execute("DROP EXTENSION IF EXISTS vector")
