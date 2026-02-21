from __future__ import annotations

"""
Role and permission system.

Single source of truth for:
  - Role identifiers  (Roles)
  - Permission identifiers  (Permissions)
  - Role → permission mapping  (ROLE_PERMISSIONS)
  - JWT claim helpers  (get_role, get_permissions, has_permission)
  - FastAPI dependency factory  (require_permission)
"""

from typing import Any, Dict, Set

from fastapi import Depends

from app.core.auth import require_auth
from app.core.config import settings
from app.lib.errors import ApiException


# ── Role constants ─────────────────────────────────────────────────────────────

class Roles:
    ADMIN = "admin"
    LIBRARIAN = "librarian"
    USER = "user"


# ── Permission constants ───────────────────────────────────────────────────────

class Permissions:
    MANAGE_BOOKS = "manage_books"    # create / delete books
    MANAGE_LOANS = "manage_loans"    # return any loan (not just own)
    VIEW_ALL_LOANS = "view_all_loans"  # list loans across all users


# ── Role → permission mapping ─────────────────────────────────────────────────

ROLE_PERMISSIONS: Dict[str, Set[str]] = {
    Roles.ADMIN: {
        Permissions.MANAGE_BOOKS,
        Permissions.MANAGE_LOANS,
        Permissions.VIEW_ALL_LOANS,
    },
    Roles.LIBRARIAN: {
        Permissions.MANAGE_BOOKS,
        Permissions.MANAGE_LOANS,
        Permissions.VIEW_ALL_LOANS,
    },
    Roles.USER: set(),
}


# ── Claim helpers ──────────────────────────────────────────────────────────────

def get_role(claims: Dict[str, Any]) -> str:
    """
    Extract the user's role from verified JWT claims.
    Falls back to Roles.USER when the claim is absent.
    The claim key is read from settings so it stays configurable via env var.
    """
    return claims.get(settings.ADMIN_ROLE_CLAIM_KEY, Roles.USER)


def get_permissions(claims: Dict[str, Any]) -> Set[str]:
    """Return the full permission set for the role encoded in the claims."""
    return ROLE_PERMISSIONS.get(get_role(claims), set())


def has_permission(claims: Dict[str, Any], permission: str) -> bool:
    """Return True when the claims grant the requested permission."""
    return permission in get_permissions(claims)


# ── FastAPI dependency factory ────────────────────────────────────────────────

def require_permission(permission: str):
    """
    Return a FastAPI dependency that enforces a single permission.

    Usage:
        @router.post("/books")
        async def create_book(
            claims: dict = Depends(require_permission(Permissions.MANAGE_BOOKS))
        ):
            ...

    Raises 403 when the caller's role does not include the permission.
    """
    async def _dependency(
        claims: Dict[str, Any] = Depends(require_auth),
    ) -> Dict[str, Any]:
        if not has_permission(claims, permission):
            raise ApiException(
                code="FORBIDDEN",
                message="You do not have permission to perform this action.",
                status_code=403,
            )
        return claims

    # Give the inner function a unique name so FastAPI generates distinct
    # dependency cache keys when require_permission is called multiple times.
    _dependency.__name__ = f"require_permission_{permission}"
    return _dependency
