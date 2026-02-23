from __future__ import annotations

"""
Analytics repository: deterministic metrics via SQLAlchemy aggregates.
All queries run against the DB — no in-memory filtering.
"""

import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List

from sqlalchemy import and_, case, func, or_
from sqlalchemy.orm import Session

from app.domain.models import Book, Loan


def _now_utc() -> datetime:
    return datetime.now(timezone.utc)


# ── Individual metric queries ──────────────────────────────────────────────────


def total_books(db: Session) -> int:
    return db.query(func.count(Book.id)).scalar() or 0


def total_available_copies(db: Session) -> int:
    return db.query(func.sum(Book.available_copies)).scalar() or 0


def active_loans_count(db: Session) -> int:
    """All currently borrowed (unreturned) loans."""
    return db.query(func.count(Loan.id)).filter(Loan.status == "borrowed").scalar() or 0


def loans_in_window(db: Session, cutoff: datetime) -> int:
    """Loans created within the analytics window."""
    return (
        db.query(func.count(Loan.id))
        .filter(Loan.borrowed_at >= cutoff)
        .scalar()
        or 0
    )


def returned_loans_in_window(db: Session, cutoff: datetime) -> int:
    """Loans returned within the analytics window."""
    return (
        db.query(func.count(Loan.id))
        .filter(Loan.status == "returned", Loan.returned_at >= cutoff)
        .scalar()
        or 0
    )


# ── Trending books ─────────────────────────────────────────────────────────────


def trending_books(db: Session, cutoff: datetime, limit: int = 5) -> List[Dict[str, Any]]:
    """
    Top books by number of loans borrowed_at within the window.
    Returns dicts with bookId, title, author, borrowCount, availableCopies.
    """
    borrow_count_expr = func.count(
        case((Loan.borrowed_at >= cutoff, Loan.id), else_=None)
    )

    rows = (
        db.query(
            Book.id,
            Book.title,
            Book.author,
            Book.available_copies,
            borrow_count_expr.label("borrow_count"),
        )
        .outerjoin(Loan, Loan.book_id == Book.id)
        .group_by(Book.id, Book.title, Book.author, Book.available_copies)
        .order_by(borrow_count_expr.desc())
        .limit(limit)
        .all()
    )

    return [
        {
            "bookId": str(r.id),
            "title": r.title,
            "author": r.author,
            "borrowCount": r.borrow_count or 0,
            "availableCopies": r.available_copies,
        }
        for r in rows
    ]


# ── Low stock alerts ───────────────────────────────────────────────────────────


def low_stock_alerts(db: Session, cutoff: datetime, limit: int = 5) -> List[Dict[str, Any]]:
    """
    Books where available_copies <= 1
    OR (available_copies <= 2 AND borrow_count_in_window >= 3).
    Ordered by available_copies ASC then borrow_count DESC.
    """
    borrow_count_expr = func.count(
        case((Loan.borrowed_at >= cutoff, Loan.id), else_=None)
    )

    rows = (
        db.query(
            Book.id,
            Book.title,
            Book.author,
            Book.available_copies,
            borrow_count_expr.label("borrow_count"),
        )
        .outerjoin(Loan, Loan.book_id == Book.id)
        .group_by(Book.id, Book.title, Book.author, Book.available_copies)
        .having(
            or_(
                Book.available_copies <= 1,
                and_(Book.available_copies <= 2, borrow_count_expr >= 3),
            )
        )
        .order_by(Book.available_copies.asc(), borrow_count_expr.desc())
        .limit(limit)
        .all()
    )

    return [
        {
            "bookId": str(r.id),
            "title": r.title,
            "author": r.author,
            "availableCopies": r.available_copies,
            "borrowCount": r.borrow_count or 0,
        }
        for r in rows
    ]


# ── Dormant books ──────────────────────────────────────────────────────────────


def dormant_books(db: Session, dormant_days: int = 90, limit: int = 5) -> List[Dict[str, Any]]:
    """
    Books with no loans in the last `dormant_days` days (or never borrowed).
    Ordered by last_borrowed_at ASC (nulls first).
    """
    dormant_cutoff = _now_utc() - timedelta(days=dormant_days)
    last_borrowed_expr = func.max(Loan.borrowed_at)

    rows = (
        db.query(
            Book.id,
            Book.title,
            Book.author,
            last_borrowed_expr.label("last_borrowed_at"),
        )
        .outerjoin(Loan, Loan.book_id == Book.id)
        .group_by(Book.id, Book.title, Book.author)
        .having(
            or_(
                last_borrowed_expr.is_(None),
                last_borrowed_expr < dormant_cutoff,
            )
        )
        .order_by(last_borrowed_expr.asc().nullsfirst())
        .limit(limit)
        .all()
    )

    return [
        {
            "bookId": str(r.id),
            "title": r.title,
            "author": r.author,
            "lastBorrowedAt": r.last_borrowed_at.isoformat() if r.last_borrowed_at else None,
        }
        for r in rows
    ]


# ── Aggregate entry point ──────────────────────────────────────────────────────


def compute_metrics(db: Session, window_days: int) -> Dict[str, Any]:
    cutoff = _now_utc() - timedelta(days=window_days)

    return {
        "totalBooks": total_books(db),
        "totalLoans": loans_in_window(db, cutoff),
        "activeLoans": active_loans_count(db),
        "returnedLoans": returned_loans_in_window(db, cutoff),
        "totalAvailableCopies": total_available_copies(db),
        "trendingBooks": trending_books(db, cutoff),
        "lowStockAlerts": low_stock_alerts(db, cutoff),
        "dormantBooks": dormant_books(db),
    }
