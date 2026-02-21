from __future__ import annotations

import uuid
from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.domain.models import Book


def create(db: Session, data: dict) -> Book:
    book = Book(**data)
    db.add(book)
    db.commit()
    db.refresh(book)
    return book


def list_books(db: Session, skip: int = 0, limit: int = 50) -> List[Book]:
    return (
        db.query(Book)
        .order_by(Book.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


def get_by_id(db: Session, book_id: uuid.UUID) -> Optional[Book]:
    return db.query(Book).filter(Book.id == book_id).first()


def get_for_update(db: Session, book_id: uuid.UUID) -> Optional[Book]:
    """Fetch a book row with a SELECT FOR UPDATE lock for use inside a transaction."""
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
