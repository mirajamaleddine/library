from __future__ import annotations

import base64
import json
from typing import Any, Dict, Optional


def encode_cursor(data: Dict[str, Any]) -> str:
    """Encode a dict of cursor fields as a URL-safe base64 string."""
    payload = json.dumps(data, default=str)
    return base64.urlsafe_b64encode(payload.encode()).decode()


def decode_cursor(cursor: str) -> Optional[Dict[str, Any]]:
    """Decode a cursor string; returns None if the input is invalid."""
    try:
        # urlsafe_b64decode requires padding to be a multiple of 4.
        padded = cursor + "=" * (-len(cursor) % 4)
        return json.loads(base64.urlsafe_b64decode(padded).decode())
    except Exception:
        return None
