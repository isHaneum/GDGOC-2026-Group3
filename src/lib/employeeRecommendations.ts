import type { EmployeeRecommendationsResponse } from "../../shared/employeeRecommendations";
import { apiErrorMessage } from "./authClient";

const EMPLOYEE_RECOMMENDATIONS_CACHE_KEY = "bridge_employee_recommendations_cache_v1";

export type { EmployeeRecommendationsResponse };

export function readCachedEmployeeRecommendations(): EmployeeRecommendationsResponse | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(EMPLOYEE_RECOMMENDATIONS_CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as EmployeeRecommendationsResponse;
  } catch {
    return null;
  }
}

export function writeCachedEmployeeRecommendations(payload: EmployeeRecommendationsResponse) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(EMPLOYEE_RECOMMENDATIONS_CACHE_KEY, JSON.stringify(payload));
  } catch {
    // Local storage may be unavailable in private or embedded contexts.
  }
}

export function clearCachedEmployeeRecommendations() {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.removeItem(EMPLOYEE_RECOMMENDATIONS_CACHE_KEY);
  } catch {
    // Local storage may be unavailable in private or embedded contexts.
  }
}

export async function fetchEmployeeRecommendations(): Promise<EmployeeRecommendationsResponse> {
  const response = await fetch("/api/employee/recommends", { cache: "no-store" });
  if (!response.ok) {
    throw new Error(await apiErrorMessage(response, "추천 데이터를 불러오지 못했습니다."));
  }

  return response.json() as Promise<EmployeeRecommendationsResponse>;
}