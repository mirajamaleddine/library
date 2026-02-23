from __future__ import annotations

from typing import Any, Dict

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.authorization import Permissions, require_permission
from app.core.db import get_db
from app.core.config import settings
from app.repos import analytics_repo
from app.services.ai_insights_service import generate_insights
from app.v1.schemas.analytics import (
    AiInsightsOut,
    AnalyticsSummaryOut,
    DormantBookOut,
    LowStockAlertOut,
    MetricsOut,
    TrendingBookOut,
)

router = APIRouter(tags=["analytics"])


@router.get("/analytics/summary", response_model=AnalyticsSummaryOut)
async def get_analytics_summary(
    days: int = Query(
        default=None,
        ge=1,
        le=365,
        description="Window in days for loan metrics (default from env)",
    ),
    db: Session = Depends(get_db),
    _claims: Dict[str, Any] = Depends(require_permission(Permissions.VIEW_ALL_LOANS)),
) -> AnalyticsSummaryOut:
    window_days = days if days is not None else settings.ANALYTICS_DEFAULT_WINDOW_DAYS

    raw_metrics = analytics_repo.compute_metrics(db, window_days)

    metrics = MetricsOut(
        totalBooks=raw_metrics["totalBooks"],
        totalLoans=raw_metrics["totalLoans"],
        activeLoans=raw_metrics["activeLoans"],
        returnedLoans=raw_metrics["returnedLoans"],
        totalAvailableCopies=raw_metrics["totalAvailableCopies"],
        trendingBooks=[TrendingBookOut(**b) for b in raw_metrics["trendingBooks"]],
        lowStockAlerts=[LowStockAlertOut(**b) for b in raw_metrics["lowStockAlerts"]],
        dormantBooks=[DormantBookOut(**b) for b in raw_metrics["dormantBooks"]],
    )

    # Build a minimal, safe version of metrics for the AI prompt (no UUIDs in lists)
    ai_prompt_metrics = {
        "windowDays": window_days,
        "totalBooks": metrics.totalBooks,
        "totalLoans": metrics.totalLoans,
        "activeLoans": metrics.activeLoans,
        "returnedLoans": metrics.returnedLoans,
        "totalAvailableCopies": metrics.totalAvailableCopies,
        "trendingBooks": [
            {"title": b.title, "author": b.author, "borrowCount": b.borrowCount}
            for b in metrics.trendingBooks
        ],
        "lowStockAlerts": [
            {
                "title": b.title,
                "author": b.author,
                "availableCopies": b.availableCopies,
                "borrowCount": b.borrowCount,
            }
            for b in metrics.lowStockAlerts
        ],
        "dormantBooks": [
            {"title": b.title, "author": b.author, "lastBorrowedAt": b.lastBorrowedAt}
            for b in metrics.dormantBooks
        ],
    }

    ai_raw = await generate_insights(window_days, ai_prompt_metrics)
    ai = AiInsightsOut(
        summary=ai_raw["summary"],
        insights=ai_raw["insights"],
        recommendedActions=ai_raw["recommendedActions"],
    )

    return AnalyticsSummaryOut(windowDays=window_days, metrics=metrics, ai=ai)
