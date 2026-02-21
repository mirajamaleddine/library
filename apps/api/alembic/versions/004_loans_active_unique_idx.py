"""enforce one active loan per user per book

Revision ID: 004
Revises: 003
Create Date: 2026-02-21 00:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "004"
down_revision: Union[str, None] = "003"
branch_labels: Union[Sequence[str], None] = None
depends_on: Union[Sequence[str], None] = None


def upgrade() -> None:
    # Step 1: Clean up any duplicate active loans that exist before adding the
    # unique constraint.  For each (borrower_id, book_id) pair that has more
    # than one "borrowed" loan, keep the oldest and mark the rest as "returned",
    # then restore available_copies for the affected books.
    op.execute(sa.text("""
        WITH ranked AS (
            SELECT
                id,
                book_id,
                ROW_NUMBER() OVER (
                    PARTITION BY borrower_id, book_id
                    ORDER BY borrowed_at ASC
                ) AS rn
            FROM loans
            WHERE status = 'borrowed'
        ),
        to_return AS (
            SELECT id, book_id FROM ranked WHERE rn > 1
        ),
        updated_loans AS (
            UPDATE loans
               SET status = 'returned', returned_at = now()
             WHERE id IN (SELECT id FROM to_return)
            RETURNING book_id
        ),
        book_increments AS (
            SELECT book_id, COUNT(*) AS cnt
              FROM updated_loans
             GROUP BY book_id
        )
        UPDATE books b
           SET available_copies = b.available_copies + bi.cnt
          FROM book_increments bi
         WHERE b.id = bi.book_id
    """))

    # Step 2: Safe to add the partial unique index now.
    op.create_index(
        "ix_loans_active_unique",
        "loans",
        ["borrower_id", "book_id"],
        unique=True,
        postgresql_where=sa.text("status = 'borrowed'"),
    )


def downgrade() -> None:
    op.drop_index("ix_loans_active_unique", table_name="loans")
