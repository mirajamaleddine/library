from __future__ import annotations

import asyncio
import hashlib
import json
import logging
import random
import time
from typing import Any, Dict, Tuple

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

_FALLBACK: Dict[str, Any] = {
    "summary": "AI insights not configured.",
    "insights": [],
    "recommendedActions": [],
}

_SYSTEM_PROMPT = """You are a library analytics assistant.
Your job is to interpret the provided library metrics and return a concise analysis.

STRICT RULES:
- You MUST NOT invent book titles, author names, or any numbers.
- You MUST only reference data that appears in the provided metrics JSON.
- Keep the summary to 2-3 sentences.
- Provide 2-4 insight bullet points.
- Provide 2-3 recommended actions for library staff.
- Return ONLY a valid JSON object with exactly these keys:
  {
    "summary": "<string>",
    "insights": ["<string>", ...],
    "recommendedActions": ["<string>", ...]
  }
Do not include any markdown, explanation, or text outside the JSON object."""


# -------------------------
# Simple in-memory TTL cache
# -------------------------
# key -> (expires_at_epoch_seconds, value)
_CACHE: Dict[str, Tuple[float, Dict[str, Any]]] = {}

# default 10 minutes; override via env if you add it to settings
_DEFAULT_TTL_SECONDS = getattr(settings, "AI_INSIGHTS_TTL_SECONDS", 600)


def _metrics_cache_key(window_days: int, metrics: Dict[str, Any]) -> str:
    # stable hash so ordering differences don't bust cache
    payload = json.dumps(metrics, sort_keys=True, default=str).encode("utf-8")
    digest = hashlib.sha256(payload).hexdigest()[:16]
    return f"ai_insights:v1:{window_days}:{digest}"


def _cache_get(key: str) -> Dict[str, Any] | None:
    hit = _CACHE.get(key)
    if not hit:
        return None
    expires_at, value = hit
    if time.time() >= expires_at:
        _CACHE.pop(key, None)
        return None
    return value


def _cache_set(key: str, value: Dict[str, Any], ttl_seconds: int = _DEFAULT_TTL_SECONDS) -> None:
    _CACHE[key] = (time.time() + ttl_seconds, value)


def _build_user_message(window_days: int, metrics: Dict[str, Any]) -> str:
    safe_metrics = json.dumps(metrics, indent=2, default=str)
    return (
        f"Here are the library metrics for the last {window_days} days.\n\n"
        f"Metrics:\n{safe_metrics}\n\n"
        "Analyse these metrics and return your response as the required JSON object."
    )


def _normalize_llm_output(parsed: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "summary": str(parsed.get("summary", "")).strip(),
        "insights": [str(i).strip() for i in (parsed.get("insights") or []) if str(i).strip()],
        "recommendedActions": [
            str(a).strip() for a in (parsed.get("recommendedActions") or []) if str(a).strip()
        ],
    }


async def _call_openai(window_days: int, metrics: Dict[str, Any]) -> Dict[str, Any]:
    payload = {
        "model": settings.OPENAI_MODEL,
        "messages": [
            {"role": "system", "content": _SYSTEM_PROMPT},
            {"role": "user", "content": _build_user_message(window_days, metrics)},
        ],
        "response_format": {"type": "json_object"},
        # Keep this modest; reduces rate-limit pressure. :contentReference[oaicite:1]{index=1}
        "max_tokens": 350,
        "temperature": 0.3,
    }

    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.post(
            "https://api.openai.com/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
                "Content-Type": "application/json",
            },
            json=payload,
        )
        resp.raise_for_status()

    content: str = resp.json()["choices"][0]["message"]["content"]
    return _normalize_llm_output(json.loads(content))


async def generate_insights(window_days: int, metrics: Dict[str, Any]) -> Dict[str, Any]:
    """
    Call OpenAI and return {summary, insights, recommendedActions}.
    Adds TTL caching + rate-limit safe retries.
    Falls back to safe output if anything fails.
    """
    if not settings.OPENAI_API_KEY:
        return _FALLBACK

    cache_key = _metrics_cache_key(window_days, metrics)
    cached = _cache_get(cache_key)
    if cached:
        return cached

    # Retry policy: a few tries with exponential backoff.
    # OpenAI recommends exponential backoff for 429s. :contentReference[oaicite:2]{index=2}
    max_attempts = 4
    base_delay = 1.0

    for attempt in range(1, max_attempts + 1):
        try:
            result = await _call_openai(window_days, metrics)
            # cache successful result
            _cache_set(cache_key, result)
            return result

        except httpx.HTTPStatusError as exc:
            status = exc.response.status_code

            # Handle rate limiting
            if status == 429:
                logger.warning(exc.response.text)
                retry_after = exc.response.headers.get("Retry-After")
                if retry_after and retry_after.isdigit():
                    sleep_s = float(retry_after)
                else:
                    # exponential backoff with jitter
                    sleep_s = base_delay * (2 ** (attempt - 1)) + random.uniform(0, 0.25)

                logger.warning("OpenAI 429 rate limited. attempt=%s sleep=%.2fs", attempt, sleep_s)

                if attempt == max_attempts:
                    break

                await asyncio.sleep(sleep_s)
                continue

            # Other 4xx/5xx: don't hammer; fail fast
            logger.warning("OpenAI HTTP error: %s", exc)
            break

        except Exception as exc:  # noqa: BLE001
            logger.warning("AI insights generation failed: %s", exc)
            break

    # Fallback: still cache briefly to avoid repeated failing calls in dev
    fallback = {
        "summary": "AI insights are temporarily unavailable.",
        "insights": [],
        "recommendedActions": [],
    }
    _cache_set(cache_key, fallback, ttl_seconds=600)
    return fallback