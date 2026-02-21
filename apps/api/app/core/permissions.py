from __future__ import annotations

from typing import Any, Dict

from fastapi import Depends

from app.core.auth import require_auth
from app.core.config import settings
from app.lib.errors import auth_forbidden


def is_admin(claims: Dict[str, Any]) -> bool:
    """Return True when the verified JWT claims grant admin access."""
    return claims.get(settings.ADMIN_ROLE_CLAIM_KEY) == settings.ADMIN_ROLE_VALUE


async def require_admin(
    claims: Dict[str, Any] = Depends(require_auth),
) -> Dict[str, Any]:
    """
    FastAPI dependency for admin-only endpoints.
    Wraps require_auth — also verifies the role claim.

    Usage:
        @router.post("/books")
        async def create_book(claims: dict = Depends(require_admin)):
            ...
    """
    if not is_admin(claims):
        raise auth_forbidden()
    return claims
