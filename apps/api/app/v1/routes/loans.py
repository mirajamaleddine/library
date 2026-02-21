from __future__ import annotations

import uuid
from typing import Any, Dict, Literal, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.auth import require_auth
from app.core.db import get_db
from app.core.permissions import is_admin
from app.services import loans_service
from app.v1.schemas.loans import LoanCreate, LoanListOut, LoanOut

router = APIRouter(tags=["loans"])


@router.post("/loans", response_model=LoanOut, status_code=201)
async def borrow_book(
    data: LoanCreate,
    db: Session = Depends(get_db),
    claims: Dict[str, Any] = Depends(require_auth),
) -> LoanOut:
    loan = loans_service.borrow_book(
        db, borrower_id=claims["sub"], book_id=data.bookId
    )
    return LoanOut.model_validate(loan)


@router.get("/loans", response_model=LoanListOut)
async def list_loans(
    show_all: bool = Query(default=False, alias="all"),
    book_id: Optional[uuid.UUID] = Query(default=None, alias="bookId"),
    status: Optional[Literal["borrowed", "returned"]] = Query(default=None),
    limit: int = Query(default=20, ge=1, le=50),
    cursor: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
    claims: Dict[str, Any] = Depends(require_auth),
) -> LoanListOut:
    loans, next_cursor = loans_service.list_loans(
        db,
        borrower_id=claims["sub"],
        all_loans=show_all and is_admin(claims),
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
    claims: Dict[str, Any] = Depends(require_auth),
) -> LoanOut:
    loan = loans_service.return_loan(
        db,
        borrower_id=claims["sub"],
        loan_id=loan_id,
        is_admin_user=is_admin(claims),
    )
    return LoanOut.model_validate(loan)
