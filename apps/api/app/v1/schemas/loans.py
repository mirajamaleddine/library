from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class LoanCreate(BaseModel):
    """Request body for POST /v1/loans (borrow a book)."""

    bookId: uuid.UUID


class LoanOut(BaseModel):
    """
    API response for a single loan.
    Serialises to camelCase JSON.
    book_title / book_author / book_cover_image_url come from
    properties on the Loan ORM model that read through the relationship.
    """

    model_config = ConfigDict(
        from_attributes=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )

    id: uuid.UUID
    book_id: uuid.UUID
    borrower_id: str
    status: str
    borrowed_at: datetime
    returned_at: Optional[datetime]
    book_title: str
    book_author: str
    book_cover_image_url: Optional[str]
