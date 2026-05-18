"""add_subjects_notes

Revision ID: 002
Revises: 001
Create Date: 2026-05-18

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "subjects",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("code", sa.String(50), nullable=True),
        sa.Column("instructor", sa.String(200), nullable=True),
        sa.Column("schedule_day", sa.String(20), nullable=True),
        sa.Column("schedule_time", sa.String(50), nullable=True),
        sa.Column("room", sa.String(100), nullable=True),
        sa.Column("color", sa.String(20), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_subjects_id", "subjects", ["id"])
    op.create_index("ix_subjects_code", "subjects", ["code"])

    op.create_table(
        "subject_files",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("subject_id", sa.Integer(), sa.ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False),
        sa.Column("filename", sa.String(500), nullable=False),
        sa.Column("original_name", sa.String(500), nullable=False),
        sa.Column("file_type", sa.String(100), nullable=True),
        sa.Column("file_size", sa.Integer(), server_default="0"),
        sa.Column("file_path", sa.String(1000), nullable=False),
        sa.Column("uploaded_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )
    op.create_index("ix_subject_files_id", "subject_files", ["id"])
    op.create_index("ix_subject_files_subject_id", "subject_files", ["subject_id"])

    op.create_table(
        "notes",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("title", sa.String(300), nullable=False),
        sa.Column("content", sa.Text(), nullable=True),
        sa.Column("type", sa.String(20), server_default="text"),
        sa.Column("audio_file_path", sa.String(1000), nullable=True),
        sa.Column("duration", sa.Float(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_notes_id", "notes", ["id"])


def downgrade() -> None:
    op.drop_table("notes")
    op.drop_table("subject_files")
    op.drop_table("subjects")
