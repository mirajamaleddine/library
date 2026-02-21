from __future__ import annotations

import uuid
from typing import Any, Dict, Literal, Optional

from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session

from app.core.auth import require_auth
from app.core.authorization import Permissions, require_permission
from app.core.db import get_db
from app.lib.errors import ApiException
from app.services import books_service
from app.v1.schemas.books import BookCreate, BookListOut, BookOut

router = APIRouter(tags=["books"])


def _book_not_found(book_id: uuid.UUID) -> ApiException:
    return ApiException(
        code="NOT_FOUND",
        message=f"Book {book_id} not found.",
        status_code=404,
    )


@router.get("/books", response_model=BookListOut)
async def list_books(
    query: Optional[str] = Query(default=None, description="Search title or author"),
    author: Optional[str] = Query(default=None, description="Filter by author (contains)"),
    available_only: bool = Query(default=False, alias="availableOnly"),
    sort: Literal["createdAt:desc", "createdAt:asc", "title:asc"] = Query(
        default="createdAt:desc"
    ),
    limit: int = Query(default=20, ge=1, le=50),
    cursor: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
    _claims: Dict[str, Any] = Depends(require_auth),
) -> BookListOut:
    books, next_cursor = books_service.list_books(
        db,
        query=query,
        author=author,
        available_only=available_only,
        sort=sort,
        limit=limit,
        cursor=cursor,
    )
    return BookListOut(
        items=[BookOut.model_validate(b) for b in books],
        next_cursor=next_cursor,
    )


@router.get("/books/{book_id}", response_model=BookOut)
async def get_book(
    book_id: uuid.UUID,
    db: Session = Depends(get_db),
    _claims: Dict[str, Any] = Depends(require_auth),
) -> BookOut:
    book = books_service.get_book(db, book_id)
    if not book:
        raise _book_not_found(book_id)
    return BookOut.model_validate(book)


@router.post("/books", response_model=BookOut, status_code=201)
async def create_book(
    data: BookCreate,
    db: Session = Depends(get_db),
    _claims: Dict[str, Any] = Depends(require_permission(Permissions.MANAGE_BOOKS)),
) -> BookOut:
    book = books_service.create_book(db, data)
    return BookOut.model_validate(book)


@router.delete("/books/{book_id}", status_code=204)
async def delete_book(
    book_id: uuid.UUID,
    db: Session = Depends(get_db),
    _claims: Dict[str, Any] = Depends(require_permission(Permissions.MANAGE_BOOKS)),
) -> Response:
    deleted = books_service.delete_book(db, book_id)
    if not deleted:
        raise _book_not_found(book_id)
    return Response(status_code=204)
