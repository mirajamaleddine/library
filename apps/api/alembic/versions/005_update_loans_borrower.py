"""replace borrower_id with borrower_user_id / borrower_name / processed_by_admin_id

Revision ID: 005
Revises: 004
Create Date: 2026-02-21 00:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "005"
down_revision: Union[str, None] = "004"
branch_labels: Union[Sequence[str], None] = None
depends_on: Union[Sequence[str], None] = None


def upgrade() -> None:
    # ── 1. Add new nullable columns first ─────────────────────────────────────
    op.add_column("loans", sa.Column("borrower_user_id", sa.String(255), nullable=True))
    op.add_column("loans", sa.Column("borrower_name", sa.String(255), nullable=True))
    op.add_column("loans", sa.Column("processed_by_admin_id", sa.String(255), nullable=True))

    # ── 2. Migrate existing rows ───────────────────────────────────────────────
    # Old system was self-service, so borrower_id == the person who checked out.
    # Map it to borrower_user_id (registered user path) and use it as a
    # best-effort processed_by_admin_id for legacy rows.
    op.execute(sa.text("""
        UPDATE loans
           SET borrower_user_id    = borrower_id,
               processed_by_admin_id = borrower_id
         WHERE borrower_id IS NOT NULL
    """))

    # ── 3. Enforce NOT NULL on processed_by_admin_id ──────────────────────────
    op.alter_column("loans", "processed_by_admin_id", nullable=False)

    # ── 4. Index the new borrower_user_id column ──────────────────────────────
    op.create_index("ix_loans_borrower_user_id", "loans", ["borrower_user_id"])

    # ── 5. Replace the old active-loan unique index ───────────────────────────
    # Old index: (borrower_id, book_id) WHERE status = 'borrowed'
    # New index: (borrower_user_id, book_id) WHERE status='borrowed' AND borrower_user_id IS NOT NULL
    # (anonymous loans have no uniqueness constraint)
    op.drop_index("ix_loans_active_unique", table_name="loans")
    op.create_index(
        "ix_loans_active_user_unique",
        "loans",
        ["borrower_user_id", "book_id"],
        unique=True,
        postgresql_where=sa.text(
            "status = 'borrowed' AND borrower_user_id IS NOT NULL"
        ),
    )

    # ── 6. Drop the old borrower_id column and its index ─────────────────────
    op.drop_index("ix_loans_borrower_id", table_name="loans")
    op.drop_column("loans", "borrower_id")


def downgrade() -> None:
    op.add_column("loans", sa.Column("borrower_id", sa.String(255), nullable=True))
    op.execute(sa.text("""
        UPDATE loans
           SET borrower_id = borrower_user_id
         WHERE borrower_user_id IS NOT NULL
    """))
    op.alter_column("loans", "borrower_id", nullable=False)
    op.create_index("ix_loans_borrower_id", "loans", ["borrower_id"])

    op.drop_index("ix_loans_active_user_unique", table_name="loans")
    op.create_index(
        "ix_loans_active_unique",
        "loans",
        ["borrower_id", "book_id"],
        unique=True,
        postgresql_where=sa.text("status = 'borrowed'"),
    )

    op.drop_index("ix_loans_borrower_user_id", table_name="loans")
    op.drop_column("loans", "processed_by_admin_id")
    op.drop_column("loans", "borrower_name")
    op.drop_column("loans", "borrower_user_id")
