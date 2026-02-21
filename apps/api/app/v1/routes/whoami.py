from __future__ import annotations

from typing import Any, Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.core.auth import require_auth

router = APIRouter()


class WhoamiResponse(BaseModel):
    userId: Optional[str]
    email: Optional[str]
    # Sorted claim keys only — no raw values to avoid leaking sensitive data.
    claimsKeys: list[str]


@router.get("/whoami", response_model=WhoamiResponse)
async def whoami(claims: dict[str, Any] = Depends(require_auth)) -> WhoamiResponse:
    """
    Return the verified identity of the caller.
    Requires a valid Clerk JWT in the Authorization header.
    """
    email: Optional[str] = claims.get("email") or claims.get("primary_email_address") or None

    return WhoamiResponse(
        userId=claims.get("sub"),
        email=email,
        claimsKeys=sorted(claims.keys()),
    )
