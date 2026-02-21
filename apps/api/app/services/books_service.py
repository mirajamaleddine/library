from __future__ import annotations

import uuid
from typing import List, Optional

from sqlalchemy.orm import Session

from app.domain.models import Book
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
    }
    return books_repo.create(db, book_data)


def list_books(db: Session, skip: int = 0, limit: int = 50) -> List[Book]:
    return books_repo.list_books(db, skip=skip, limit=limit)


def get_book(db: Session, book_id: uuid.UUID) -> Optional[Book]:
    return books_repo.get_by_id(db, book_id)


def delete_book(db: Session, book_id: uuid.UUID) -> bool:
    return books_repo.delete(db, book_id)
