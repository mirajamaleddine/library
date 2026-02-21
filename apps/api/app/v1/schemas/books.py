from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator
from pydantic.alias_generators import to_camel


class BookCreate(BaseModel):
    """
    Accepted request body for POST /v1/books.
    Field names match what the frontend sends (camelCase).
    """

    title: str
    author: str
    description: Optional[str] = None
    isbn: Optional[str] = None
    publishedYear: Optional[int] = Field(default=None)
    availableCopies: int = Field(default=1)

    @field_validator("title", "author", mode="before")
    @classmethod
    def strip_and_require(cls, v: str) -> str:
        v = str(v).strip()
        if not v:
            raise ValueError("must not be empty")
        return v

    @field_validator("availableCopies", mode="before")
    @classmethod
    def non_negative(cls, v: int) -> int:
        if int(v) < 0:
            raise ValueError("must be >= 0")
        return int(v)


class BookOut(BaseModel):
    """API response shape for a single book. Serialises to camelCase JSON."""

    model_config = ConfigDict(
        from_attributes=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )

    id: uuid.UUID
    title: str
    author: str
    description: Optional[str]
    isbn: Optional[str]
    published_year: Optional[int]
    available_copies: int
    created_at: datetime
    updated_at: datetime
