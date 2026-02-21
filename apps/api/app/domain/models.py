from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import Base


class Book(Base):
    __tablename__ = "books"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    author: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    isbn: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    published_year: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    available_copies: Mapped[int] = mapped_column(
        Integer, nullable=False, default=1, server_default="1"
    )
    cover_image_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    def __repr__(self) -> str:
        return f"<Book id={self.id} title={self.title!r}>"


class Loan(Base):
    __tablename__ = "loans"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    book_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("books.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    borrower_id: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="borrowed", server_default="borrowed"
    )
    borrowed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    returned_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Relationship — not eager by default; service re-queries with joinedload after writes.
    book: Mapped["Book"] = relationship("Book", lazy="select")

    # Convenience properties used by LoanOut (Pydantic from_attributes reads these).
    @property
    def book_title(self) -> str:
        return self.book.title if self.book else ""

    @property
    def book_author(self) -> str:
        return self.book.author if self.book else ""

    @property
    def book_cover_image_url(self) -> Optional[str]:
        return self.book.cover_image_url if self.book else None

    def __repr__(self) -> str:
        return f"<Loan id={self.id} borrower={self.borrower_id!r} status={self.status!r}>"
