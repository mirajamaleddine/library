from __future__ import annotations

import uuid
from typing import Any, Dict, Literal, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.auth import require_auth
from app.core.authorization import Permissions, has_permission, require_permission
from app.core.db import get_db
from app.services import loans_service
from app.v1.schemas.loans import LoanCreate, LoanListOut, LoanOut

router = APIRouter(tags=["loans"])


@router.post("/loans", response_model=LoanOut, status_code=201)
async def checkout_book(
    data: LoanCreate,
    db: Session = Depends(get_db),
    claims: Dict[str, Any] = Depends(require_permission(Permissions.MANAGE_LOANS)),
) -> LoanOut:
    """Staff-only: check out a book on behalf of a borrower."""
    loan = loans_service.checkout_book(db, admin_id=claims["sub"], data=data)
    return LoanOut.model_validate(loan)


@router.get("/loans", response_model=LoanListOut)
async def list_loans(
    book_id: Optional[uuid.UUID] = Query(default=None, alias="bookId"),
    status: Optional[Literal["borrowed", "returned"]] = Query(default=None),
    limit: int = Query(default=20, ge=1, le=50),
    cursor: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
    claims: Dict[str, Any] = Depends(require_auth),
) -> LoanListOut:
    """
    List loans.
    Staff see all loans; regular users see only loans where they are the borrower.
    """
    loans, next_cursor = loans_service.list_loans(
        db,
        viewer_id=claims["sub"],
        can_see_all=has_permission(claims, Permissions.VIEW_ALL_LOANS),
        book_id=book_id,
        status=status,
        limit=limit,
        cursor=cursor,
    )
    return LoanListOut(
        items=[LoanOut.model_validate(loan) for loan in loans],
        next_cursor=next_cursor,
    )


@router.post("/loans/{loan_id}/return", response_model=LoanOut)
async def return_loan(
    loan_id: uuid.UUID,
    db: Session = Depends(get_db),
    claims: Dict[str, Any] = Depends(require_permission(Permissions.MANAGE_LOANS)),
) -> LoanOut:
    """Staff-only: check in (return) a loan."""
    loan = loans_service.return_loan(db, admin_id=claims["sub"], loan_id=loan_id)
    return LoanOut.model_validate(loan)
