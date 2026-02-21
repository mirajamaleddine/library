"""create loans

Revision ID: 003
Revises: 002
Create Date: 2026-02-21 00:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "003"
down_revision: Union[str, None] = "002"
branch_labels: Union[Sequence[str], None] = None
depends_on: Union[Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "loans",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("book_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("borrower_id", sa.String(255), nullable=False),
        sa.Column(
            "status", sa.String(20), nullable=False, server_default="borrowed"
        ),
        sa.Column(
            "borrowed_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("returned_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["book_id"], ["books.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_loans_book_id", "loans", ["book_id"])
    op.create_index("ix_loans_borrower_id", "loans", ["borrower_id"])


def downgrade() -> None:
    op.drop_index("ix_loans_borrower_id", table_name="loans")
    op.drop_index("ix_loans_book_id", table_name="loans")
    op.drop_table("loans")
