from __future__ import annotations

from typing import Any, List

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.core.auth import require_auth
from app.core.authorization import get_permissions

router = APIRouter()


class WhoamiResponse(BaseModel):
    userId: str
    permissions: List[str]


@router.get("/whoami", response_model=WhoamiResponse)
async def whoami(claims: dict[str, Any] = Depends(require_auth)) -> WhoamiResponse:
    """
    Return the verified identity and permissions of the caller.
    Requires a valid Clerk JWT. Permissions are derived from the role in claims
    (role is not exposed to the client).
    """
    user_id = claims.get("sub") or ""
    perms = get_permissions(claims)
    return WhoamiResponse(
        userId=user_id,
        permissions=sorted(perms),
    )
