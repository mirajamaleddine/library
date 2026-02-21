from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from sqlalchemy import func, or_, and_, select
from sqlalchemy.orm import Session

from app.domain.models import Book


def create(db: Session, data: dict) -> Book:
    book = Book(**data)
    db.add(book)
    db.commit()
    db.refresh(book)
    return book


def list_paginated(
    db: Session,
    *,
    query: Optional[str] = None,
    author: Optional[str] = None,
    available_only: bool = False,
    sort: str = "createdAt:desc",
    limit: int = 21,
    cursor_data: Optional[Dict[str, Any]] = None,
) -> List[Book]:
    """
    Filtered, sorted, cursor-paginated book list.
    Caller should request limit+1 rows to detect whether a next page exists.

    Cursor shape per sort:
      createdAt:desc / createdAt:asc  →  {"ts": "<ISO datetime>", "id": "<uuid>"}
      title:asc                       →  {"title": "<lower-case title>", "id": "<uuid>"}
    """
    stmt = select(Book)

    # ── Filters ────────────────────────────────────────────────────────────────
    if query:
        pattern = f"%{query}%"
        stmt = stmt.where(or_(Book.title.ilike(pattern), Book.author.ilike(pattern)))
    if author:
        stmt = stmt.where(Book.author.ilike(f"%{author}%"))
    if available_only:
        stmt = stmt.where(Book.available_copies > 0)

    # ── Sort + cursor ──────────────────────────────────────────────────────────
    if sort == "createdAt:asc":
        if cursor_data:
            ts = datetime.fromisoformat(cursor_data["ts"])
            cid = uuid.UUID(cursor_data["id"])
            stmt = stmt.where(
                or_(
                    Book.created_at > ts,
                    and_(Book.created_at == ts, Book.id > cid),
                )
            )
        stmt = stmt.order_by(Book.created_at.asc(), Book.id.asc())

    elif sort == "title:asc":
        if cursor_data:
            title_lc = cursor_data["title"]  # stored pre-lowercased
            cid = uuid.UUID(cursor_data["id"])
            stmt = stmt.where(
                or_(
                    func.lower(Book.title) > title_lc,
                    and_(func.lower(Book.title) == title_lc, Book.id > cid),
                )
            )
        stmt = stmt.order_by(func.lower(Book.title).asc(), Book.id.asc())

    else:  # createdAt:desc (default)
        if cursor_data:
            ts = datetime.fromisoformat(cursor_data["ts"])
            cid = uuid.UUID(cursor_data["id"])
            stmt = stmt.where(
                or_(
                    Book.created_at < ts,
                    and_(Book.created_at == ts, Book.id < cid),
                )
            )
        stmt = stmt.order_by(Book.created_at.desc(), Book.id.desc())

    stmt = stmt.limit(limit)
    return list(db.execute(stmt).scalars().all())


def get_by_id(db: Session, book_id: uuid.UUID) -> Optional[Book]:
    return db.query(Book).filter(Book.id == book_id).first()


def get_for_update(db: Session, book_id: uuid.UUID) -> Optional[Book]:
    """Fetch a book row with SELECT FOR UPDATE for use inside a transaction."""
    return (
        db.execute(select(Book).where(Book.id == book_id).with_for_update())
        .scalar_one_or_none()
    )


def delete(db: Session, book_id: uuid.UUID) -> bool:
    book = get_by_id(db, book_id)
    if not book:
        return False
    db.delete(book)
    db.commit()
    return True
