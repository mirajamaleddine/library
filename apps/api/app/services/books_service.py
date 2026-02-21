from __future__ import annotations

import uuid
from typing import List, Optional, Tuple

from sqlalchemy.orm import Session

from app.domain.models import Book
from app.lib.pagination import decode_cursor, encode_cursor
from app.repos import books_repo
from app.v1.schemas.books import BookCreate


def create_book(db: Session, data: BookCreate) -> Book:
    book_data = {
        "title": data.title.strip(),
        "author": data.author.strip(),
        "description": data.description,
        "isbn": data.isbn,
        "published_year": data.publishedYear,
        "available_copies": data.availableCopies,
        "cover_image_url": data.coverImageUrl or None,
    }
    return books_repo.create(db, book_data)


def list_books(
    db: Session,
    *,
    query: Optional[str] = None,
    author: Optional[str] = None,
    available_only: bool = False,
    sort: str = "createdAt:desc",
    limit: int = 20,
    cursor: Optional[str] = None,
) -> Tuple[List[Book], Optional[str]]:
    cursor_data = decode_cursor(cursor) if cursor else None

    # Fetch one extra row to detect whether a next page exists.
    rows = books_repo.list_paginated(
        db,
        query=query,
        author=author,
        available_only=available_only,
        sort=sort,
        limit=limit + 1,
        cursor_data=cursor_data,
    )

    has_more = len(rows) > limit
    if has_more:
        rows = rows[:limit]

    next_cursor: Optional[str] = None
    if has_more and rows:
        last = rows[-1]
        if sort in ("createdAt:desc", "createdAt:asc"):
            next_cursor = encode_cursor({"ts": last.created_at.isoformat(), "id": str(last.id)})
        else:  # title:asc
            next_cursor = encode_cursor({"title": last.title.lower(), "id": str(last.id)})

    return rows, next_cursor


def get_book(db: Session, book_id: uuid.UUID) -> Optional[Book]:
    return books_repo.get_by_id(db, book_id)


def delete_book(db: Session, book_id: uuid.UUID) -> bool:
    return books_repo.delete(db, book_id)
