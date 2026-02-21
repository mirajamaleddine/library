from __future__ import annotations

"""
Centralised error helpers.

Raise ApiException instead of HTTPException for all application-level errors.
The exception handler in main.py serialises it into the agreed error contract:

    { "error": { "code": "...", "message": "...", "details": {...} } }
"""
from typing import Optional


class ApiException(Exception):
    def __init__(
        self,
        code: str,
        message: str,
        status_code: int = 400,
        details: Optional[dict] = None,
    ) -> None:
        super().__init__(message)
        self.code = code
        self.message = message
        self.status_code = status_code
        self.details = details


# ── Auth error constructors ───────────────────────────────────────────────────

def auth_missing() -> ApiException:
    return ApiException(
        code="AUTH_MISSING",
        message="Authorization header is required.",
        status_code=401,
    )


def auth_invalid(detail: str = "Token is invalid.") -> ApiException:
    return ApiException(code="AUTH_INVALID", message=detail, status_code=401)


def auth_expired() -> ApiException:
    return ApiException(code="AUTH_EXPIRED", message="Token has expired.", status_code=401)


def auth_forbidden() -> ApiException:
    return ApiException(
        code="AUTH_FORBIDDEN",
        message="You do not have permission to perform this action.",
        status_code=403,
    )
