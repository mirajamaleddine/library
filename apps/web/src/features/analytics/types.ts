export interface TrendingBook {
  bookId: string;
  title: string;
  author: string;
  borrowCount: number;
  availableCopies: number;
}

export interface LowStockAlert {
  bookId: string;
  title: string;
  author: string;
  availableCopies: number;
  borrowCount: number;
}

export interface DormantBook {
  bookId: string;
  title: string;
  author: string;
  lastBorrowedAt: string | null;
}

export interface AnalyticsMetrics {
  totalBooks: number;
  totalLoans: number;
  activeLoans: number;
  returnedLoans: number;
  totalAvailableCopies: number;
  trendingBooks: TrendingBook[];
  lowStockAlerts: LowStockAlert[];
  dormantBooks: DormantBook[];
}

export interface AiInsights {
  summary: string;
  insights: string[];
  recommendedActions: string[];
}

export interface AnalyticsSummary {
  windowDays: number;
  metrics: AnalyticsMetrics;
  ai: AiInsights;
}
