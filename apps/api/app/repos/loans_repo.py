from __future__ import annotations

import uuid
from typing import List, Optional

from sqlalchemy.orm import Session, joinedload

from app.domain.models import Loan


def find_active_loan_for_book(
    db: Session, borrower_id: str, book_id: uuid.UUID
) -> Optional[Loan]:
    """Return the borrower's active (status=borrowed) loan for a book, if any."""
    return (
        db.query(Loan)
        .filter(
            Loan.borrower_id == borrower_id,
            Loan.book_id == book_id,
            Loan.status == "borrowed",
        )
        .first()
    )


def list_loans(
    db: Session,
    borrower_id: Optional[str] = None,
    book_id: Optional[uuid.UUID] = None,
    skip: int = 0,
    limit: int = 50,
) -> List[Loan]:
    """
    List loans ordered by most-recently-borrowed first.
    Pass borrower_id=None to list all loans (admin use).
    Pass book_id to filter by a specific book.
    """
    query = db.query(Loan).options(joinedload(Loan.book))
    if borrower_id is not None:
        query = query.filter(Loan.borrower_id == borrower_id)
    if book_id is not None:
        query = query.filter(Loan.book_id == book_id)
    return (
        query.order_by(Loan.borrowed_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
