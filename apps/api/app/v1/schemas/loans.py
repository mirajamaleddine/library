from __future__ import annotations

import uuid
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, model_validator
from pydantic.alias_generators import to_camel


class LoanCreate(BaseModel):
    """Request body for POST /v1/loans (librarian/admin checkout)."""

    bookId: uuid.UUID
    # Exactly one of borrowerUserId or borrowerName must be provided.
    borrowerUserId: Optional[str] = None  # Clerk sub of a registered user
    borrowerName: Optional[str] = None   # Free-text name for anonymous borrowers

    @model_validator(mode="after")
    def exactly_one_borrower(self) -> "LoanCreate":
        has_user = bool(self.borrowerUserId and self.borrowerUserId.strip())
        has_name = bool(self.borrowerName and self.borrowerName.strip())
        if has_user and has_name:
            raise ValueError("Provide either borrowerUserId or borrowerName, not both.")
        if not has_user and not has_name:
            raise ValueError("Either borrowerUserId or borrowerName is required.")
        return self


class LoanOut(BaseModel):
    """API response for a single loan (camelCase JSON)."""

    model_config = ConfigDict(
        from_attributes=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )

    id: uuid.UUID
    book_id: uuid.UUID
    borrower_user_id: Optional[str]
    borrower_name: Optional[str]
    processed_by_admin_id: str
    status: str
    borrowed_at: datetime
    returned_at: Optional[datetime]
    book_title: str
    book_author: str
    book_cover_image_url: Optional[str]


class LoanListOut(BaseModel):
    """Paginated list response for GET /v1/loans."""

    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
    )

    items: List[LoanOut]
    next_cursor: Optional[str] = None
