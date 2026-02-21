from __future__ import annotations

"""
JWT verification using Clerk's JWKS endpoint.

Flow:
  1. Decode the JWT header (unverified) to extract `kid`.
  2. Fetch JWKS from Clerk (cached for JWKS_TTL seconds).
  3. Locate the matching key by `kid`.
  4. Verify the token: signature, expiry, issuer (if configured), audience (if configured).
  5. Return the verified claims dict.

Public interface:
  - require_auth: FastAPI dependency that extracts + verifies the Bearer token.
"""

import time
from typing import Any, Dict, Optional

import httpx
import jwt
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt.algorithms import RSAAlgorithm

from app.core.config import settings
from app.core.logging import logger
from app.lib.errors import ApiException, auth_expired, auth_invalid, auth_missing

# ── JWKS in-memory cache ──────────────────────────────────────────────────────

_JWKS_TTL = 600  # seconds — re-fetch every 10 minutes
_jwks_cache: Optional[Dict[str, Any]] = None
_jwks_cached_at: float = 0.0


async def _get_jwks() -> Dict[str, Any]:
    """Fetch and cache JWKS from Clerk. Thread-safe enough for single-process uvicorn."""
    global _jwks_cache, _jwks_cached_at

    now = time.monotonic()
    if _jwks_cache is not None and (now - _jwks_cached_at) < _JWKS_TTL:
        return _jwks_cache

    if not settings.CLERK_JWKS_URL:
        raise ApiException(
            code="CONFIG_ERROR",
            message="CLERK_JWKS_URL is not configured.",
            status_code=500,
        )

    logger.info("Fetching JWKS from %s", settings.CLERK_JWKS_URL)
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(settings.CLERK_JWKS_URL)
        resp.raise_for_status()

    _jwks_cache = resp.json()
    _jwks_cached_at = now
    return _jwks_cache  # type: ignore[return-value]


# ── Token verification ────────────────────────────────────────────────────────

async def verify_token(token: str) -> Dict[str, Any]:
    """
    Verify a Clerk-issued JWT.
    Returns the verified claims dict on success; raises ApiException on failure.
    """
    # Decode header without verification to find the signing key.
    try:
        header = jwt.get_unverified_header(token)
    except jwt.exceptions.DecodeError as exc:
        raise auth_invalid(f"Malformed token header: {exc}") from exc

    kid: Optional[str] = header.get("kid")
    if not kid:
        raise auth_invalid("Token header is missing `kid`.")

    jwks = await _get_jwks()
    key_data = next((k for k in jwks.get("keys", []) if k.get("kid") == kid), None)
    if key_data is None:
        # The key may have been rotated; invalidate cache and retry once.
        global _jwks_cache
        _jwks_cache = None
        jwks = await _get_jwks()
        key_data = next((k for k in jwks.get("keys", []) if k.get("kid") == kid), None)

    if key_data is None:
        raise auth_invalid("Token signing key not found in JWKS.")

    public_key = RSAAlgorithm.from_jwk(key_data)

    decode_kwargs: Dict[str, Any] = {
        "algorithms": ["RS256"],
        "options": {"verify_exp": True},
    }
    if settings.CLERK_ISSUER:
        decode_kwargs["issuer"] = settings.CLERK_ISSUER
    if settings.CLERK_AUDIENCE:
        decode_kwargs["audience"] = settings.CLERK_AUDIENCE

    try:
        claims: Dict[str, Any] = jwt.decode(token, public_key, **decode_kwargs)
    except jwt.ExpiredSignatureError as exc:
        raise auth_expired() from exc
    except jwt.InvalidIssuerError as exc:
        raise auth_invalid("Token issuer is invalid.") from exc
    except jwt.InvalidAudienceError as exc:
        raise auth_invalid("Token audience is invalid.") from exc
    except jwt.InvalidTokenError as exc:
        raise auth_invalid(f"Token validation failed: {exc}") from exc

    return claims


# ── FastAPI dependency ────────────────────────────────────────────────────────

_bearer = HTTPBearer(auto_error=False)


async def require_auth(
    credentials: Optional[HTTPAuthorizationCredentials] = _bearer,  # type: ignore[assignment]
) -> Dict[str, Any]:
    """
    FastAPI dependency for protected endpoints.

    Usage:
        @router.get("/protected")
        async def protected(claims: dict = Depends(require_auth)):
            ...

    Raises ApiException (→ 401) when the header is missing or the token is invalid.
    """
    if credentials is None:
        raise auth_missing()

    return await verify_token(credentials.credentials)
