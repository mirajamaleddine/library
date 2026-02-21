from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from sqlalchemy import or_, and_
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


def list_paginated(
    db: Session,
    *,
    borrower_id: Optional[str] = None,
    book_id: Optional[uuid.UUID] = None,
    status: Optional[str] = None,
    limit: int = 21,
    cursor_data: Optional[Dict[str, Any]] = None,
) -> List[Loan]:
    """
    Filtered, cursor-paginated loan list sorted by borrowed_at DESC, id DESC.
    Cursor shape: {"ts": "<ISO datetime>", "id": "<uuid>"}
    Caller should request limit+1 rows to detect a next page.
    """
    query = db.query(Loan).options(joinedload(Loan.book))

    if borrower_id is not None:
        query = query.filter(Loan.borrower_id == borrower_id)
    if book_id is not None:
        query = query.filter(Loan.book_id == book_id)
    if status is not None:
        query = query.filter(Loan.status == status)

    if cursor_data:
        ts = datetime.fromisoformat(cursor_data["ts"])
        cid = uuid.UUID(cursor_data["id"])
        query = query.filter(
            or_(
                Loan.borrowed_at < ts,
                and_(Loan.borrowed_at == ts, Loan.id < cid),
            )
        )

    return (
        query.order_by(Loan.borrowed_at.desc(), Loan.id.desc())
        .limit(limit)
        .all()
    )
