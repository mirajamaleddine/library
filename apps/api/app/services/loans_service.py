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
from app.v1.schemas.loans import LoanCreate


def _reload(db: Session, loan_id: uuid.UUID) -> Loan:
    """Re-fetch a Loan with its Book eagerly loaded (used after commit)."""
    return (
        db.execute(
            select(Loan).where(Loan.id == loan_id).options(joinedload(Loan.book))
        )
        .unique()
        .scalar_one()
    )


def checkout_book(db: Session, admin_id: str, data: LoanCreate) -> Loan:
    """
    Check out a book on behalf of a borrower. Only staff (admin/librarian) may call this.
    Validates:
      - Book exists
      - For registered users: no active loan for this book already
      - At least one copy is available
    """
    book = books_repo.get_for_update(db, data.bookId)
    if not book:
        raise ApiException(
            code="NOT_FOUND",
            message=f"Book {data.bookId} not found.",
            status_code=404,
        )

    # Duplicate-loan guard applies only to registered users.
    if data.borrowerUserId:
        borrower_uid = data.borrowerUserId.strip()
        if loans_repo.find_active_loan_for_user(db, borrower_uid, data.bookId):
            raise ApiException(
                code="ALREADY_BORROWED",
                message="This user already has an active loan for this book.",
                status_code=409,
            )

    if book.available_copies <= 0:
        raise ApiException(
            code="BOOK_UNAVAILABLE",
            message="No copies of this book are currently available.",
            status_code=409,
        )

    book.available_copies -= 1
    loan = Loan(
        book_id=data.bookId,
        borrower_user_id=data.borrowerUserId.strip() if data.borrowerUserId else None,
        borrower_name=data.borrowerName.strip() if data.borrowerName else None,
        processed_by_admin_id=admin_id,
        status="borrowed",
    )
    db.add(loan)
    db.flush()
    loan_id = loan.id
    db.commit()
    return _reload(db, loan_id)


def return_loan(db: Session, admin_id: str, loan_id: uuid.UUID) -> Loan:
    """
    Check in (return) a loan. Only staff (admin/librarian) may call this.
    admin_id is kept for audit purposes.
    """
    loan = db.execute(
        select(Loan).where(Loan.id == loan_id).with_for_update()
    ).scalar_one_or_none()

    if not loan:
        raise ApiException(
            code="NOT_FOUND",
            message=f"Loan {loan_id} not found.",
            status_code=404,
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
    viewer_id: str,
    *,
    can_see_all: bool = False,
    book_id: Optional[uuid.UUID] = None,
    status: Optional[str] = None,
    limit: int = 20,
    cursor: Optional[str] = None,
) -> Tuple[List[Loan], Optional[str]]:
    """
    List loans.
    - Staff (can_see_all=True): returns all loans unfiltered by borrower.
    - Regular users: returns only loans where borrower_user_id == viewer_id.
    """
    cursor_data = decode_cursor(cursor) if cursor else None

    rows = loans_repo.list_paginated(
        db,
        borrower_user_id=None if can_see_all else viewer_id,
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
