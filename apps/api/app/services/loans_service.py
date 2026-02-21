from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import List, Optional, Tuple

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.domain.models import Loan
from app.lib.errors import ApiException
from app.lib.pagination import decode_cursor, encode_cursor
from app.repos import books_repo, loans_repo


def _reload(db: Session, loan_id: uuid.UUID) -> Loan:
    """Re-fetch a Loan with its Book eagerly loaded (used after commit)."""
    return (
        db.execute(
            select(Loan).where(Loan.id == loan_id).options(joinedload(Loan.book))
        )
        .unique()
        .scalar_one()
    )


def borrow_book(db: Session, borrower_id: str, book_id: uuid.UUID) -> Loan:
    book = books_repo.get_for_update(db, book_id)
    if not book:
        raise ApiException(
            code="NOT_FOUND",
            message=f"Book {book_id} not found.",
            status_code=404,
        )

    if loans_repo.find_active_loan_for_book(db, borrower_id, book_id):
        raise ApiException(
            code="ALREADY_BORROWED",
            message="You already have an active loan for this book.",
            status_code=409,
        )

    if book.available_copies <= 0:
        raise ApiException(
            code="BOOK_UNAVAILABLE",
            message="No copies of this book are currently available.",
            status_code=409,
        )

    book.available_copies -= 1
    loan = Loan(book_id=book_id, borrower_id=borrower_id, status="borrowed")
    db.add(loan)
    db.flush()
    loan_id = loan.id
    db.commit()
    return _reload(db, loan_id)


def return_loan(
    db: Session,
    borrower_id: str,
    loan_id: uuid.UUID,
    is_admin_user: bool = False,
) -> Loan:
    loan = db.execute(
        select(Loan).where(Loan.id == loan_id).with_for_update()
    ).scalar_one_or_none()

    if not loan:
        raise ApiException(
            code="NOT_FOUND",
            message=f"Loan {loan_id} not found.",
            status_code=404,
        )
    if not is_admin_user and loan.borrower_id != borrower_id:
        raise ApiException(
            code="AUTH_FORBIDDEN",
            message="You do not have permission to return this loan.",
            status_code=403,
        )
    if loan.status == "returned":
        raise ApiException(
            code="LOAN_ALREADY_RETURNED",
            message="This loan has already been returned.",
            status_code=409,
        )

    loan.status = "returned"
    loan.returned_at = datetime.now(timezone.utc)

    book = books_repo.get_for_update(db, loan.book_id)
    if book:
        book.available_copies += 1

    db.commit()
    return _reload(db, loan_id)


def list_loans(
    db: Session,
    borrower_id: str,
    *,
    all_loans: bool = False,
    book_id: Optional[uuid.UUID] = None,
    status: Optional[str] = None,
    limit: int = 20,
    cursor: Optional[str] = None,
) -> Tuple[List[Loan], Optional[str]]:
    cursor_data = decode_cursor(cursor) if cursor else None

    rows = loans_repo.list_paginated(
        db,
        borrower_id=None if all_loans else borrower_id,
        book_id=book_id,
        status=status,
        limit=limit + 1,
        cursor_data=cursor_data,
    )

    has_more = len(rows) > limit
    if has_more:
        rows = rows[:limit]

    next_cursor: Optional[str] = None
    if has_more and rows:
        last = rows[-1]
        next_cursor = encode_cursor({"ts": last.borrowed_at.isoformat(), "id": str(last.id)})

    return rows, next_cursor
