from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel


class TrendingBookOut(BaseModel):
    bookId: str
    title: str
    author: str
    borrowCount: int
    availableCopies: int


class LowStockAlertOut(BaseModel):
    bookId: str
    title: str
    author: str
    availableCopies: int
    borrowCount: int


class DormantBookOut(BaseModel):
    bookId: str
    title: str
    author: str
    lastBorrowedAt: Optional[str] = None


class MetricsOut(BaseModel):
    totalBooks: int
    totalLoans: int
    activeLoans: int
    returnedLoans: int
    totalAvailableCopies: int
    trendingBooks: List[TrendingBookOut]
    lowStockAlerts: List[LowStockAlertOut]
    dormantBooks: List[DormantBookOut]


class AiInsightsOut(BaseModel):
    summary: str
    insights: List[str]
    recommendedActions: List[str]


class AnalyticsSummaryOut(BaseModel):
    windowDays: int
    metrics: MetricsOut
    ai: AiInsightsOut
