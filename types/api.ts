export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface DashboardKPIs {
  totalUsers: number;
  newUsersToday: number;
  totalGenerations: number;
  newGenerationsToday: number;
  revenue: number;
  revenueGrowth: number;
  conversionRate: number;
  activeUsers24h: number;
}

export interface ChartDataPoint {
  date: string;
  count: number;
}

export interface PieDataPoint {
  name: string;
  value: number;
}
