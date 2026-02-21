from __future__ import annotations

from typing import Any, Dict, List, Optional

import httpx
from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel

from app.core.authorization import Permissions, require_permission
from app.core.config import settings
from app.lib.errors import ApiException

router = APIRouter(tags=["users"])

CLERK_API = "https://api.clerk.com/v1"


class ClerkUserOut(BaseModel):
    id: str
    displayName: str
    email: Optional[str] = None


def _display_name(u: Dict[str, Any]) -> str:
    first = (u.get("first_name") or "").strip()
    last = (u.get("last_name") or "").strip()
    full = f"{first} {last}".strip()
    if full:
        return full
    username = (u.get("username") or "").strip()
    if username:
        return username
    emails = u.get("email_addresses") or []
    if emails:
        return emails[0].get("email_address", u["id"])
    return u["id"]


@router.get("/users", response_model=List[ClerkUserOut])
async def list_users(
    limit: int = Query(default=100, ge=1, le=200),
    _claims: Dict[str, Any] = Depends(require_permission(Permissions.MANAGE_LOANS)),
) -> List[ClerkUserOut]:
    """Staff-only: list registered Clerk users for the checkout borrower dropdown."""
    if not settings.CLERK_SECRET_KEY:
        raise ApiException(
            code="NOT_CONFIGURED",
            message="CLERK_SECRET_KEY is not configured on the server.",
            status_code=503,
        )

    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(
                f"{CLERK_API}/users",
                headers={"Authorization": f"Bearer {settings.CLERK_SECRET_KEY}"},
                params={"limit": limit, "order_by": "-created_at"},
                timeout=10.0,
            )
            resp.raise_for_status()
        except httpx.HTTPStatusError as exc:
            raise ApiException(
                code="CLERK_ERROR",
                message="Failed to fetch users from Clerk.",
                status_code=502,
            ) from exc
        except httpx.RequestError as exc:
            raise ApiException(
                code="CLERK_UNREACHABLE",
                message="Could not reach Clerk API.",
                status_code=503,
            ) from exc

    users = []
    for u in resp.json():
        emails = u.get("email_addresses") or []
        primary_email = emails[0].get("email_address") if emails else None
        users.append(
            ClerkUserOut(
                id=u["id"],
                displayName=_display_name(u),
                email=primary_email,
            )
        )
    return users
