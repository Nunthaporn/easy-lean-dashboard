import axios from "axios";

import type {
  DashboardResponse,
  FilterMeta,
} from "../types/dashboard";

// In the unified Nanyang app, keep API calls relative to the current
// frontend origin. Vite proxies /api to the shared FastAPI backend.
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

function buildParams(
  startDate: string,
  endDate: string,
  factory: string,
  selectedFactory?: string | null,
  selectedLine?: string | null,
  selectedLineFactory?: string | null
) {
  return {
    start_date: startDate,
    end_date: endDate,

    factory:
      factory === "ALL"
        ? undefined
        : factory,

    selected_factory:
      selectedFactory ||
      undefined,

    selected_line:
      selectedLine ||
      undefined,

    selected_line_factory:
      selectedLineFactory ||
      undefined,
  };
}

export async function getHealth() {
  const response =
    await api.get(
      "/api/easylean/health"
    );

  return response.data;
}

export async function getFilters(): Promise<FilterMeta> {
  const response =
    await api.get(
      "/api/easylean/filters"
    );

  return response.data;
}

export async function getDashboard(
  startDate: string,
  endDate: string,
  factory: string,

  selectedFactory?: string | null,
  selectedLine?: string | null,
  selectedLineFactory?: string | null
): Promise<DashboardResponse> {
  const params = buildParams(
    startDate,
    endDate,
    factory,

    selectedFactory,
    selectedLine,
    selectedLineFactory
  );

  const [
    summary,
    monthly,
    latest,
    monthlyFactory,
    last10,
  ] = await Promise.all([
    api.get(
      "/api/easylean/summary",
      { params }
    ),

    api.get(
      "/api/easylean/monthly-by-line",
      { params }
    ),

    api.get(
      "/api/easylean/latest-by-line",
      { params }
    ),

    api.get(
      "/api/easylean/monthly-by-factory",
      { params }
    ),

    api.get(
      "/api/easylean/last-10-days",
      { params }
    ),
  ]);

  return {
    summary: summary.data,
    monthly: monthly.data,
    latest: latest.data,

    monthlyFactory:
      monthlyFactory.data,

    last10: last10.data,
  };
}

export default api;
