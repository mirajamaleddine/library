from __future__ import annotations

"""
Re-exports from app.core.authorization for convenience.
All permission logic lives in authorization.py.
"""

from app.core.authorization import (  # noqa: F401
    Permissions,
    Roles,
    ROLE_PERMISSIONS,
    get_permissions,
    get_role,
    has_permission,
    require_permission,
)
