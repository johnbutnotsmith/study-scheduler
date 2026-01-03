// frontend/src/api/client.ts

import {
  ExamPlanRequest,
  ExamPlanResponse,
  WeeklyPlanRequest,
  WeeklyPlanResponse,
} from "../types/domain";

export interface ApiResult<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

const BASE_URL = "https://study-scheduler-mtqq.onrender.com";

async function request<T>(path: string, payload: unknown): Promise<ApiResult<T>> {
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    // Backend always returns JSON (either { plan: ... } or { detail: ... })
    const data = await res.json().catch(() => null);

    if (!res.ok) {
      return {
        ok: false,
        error: data?.detail || "Server error. Please try again.",
      };
    }

    return { ok: true, data: data as T };
  } catch (err: any) {
    return {
      ok: false,
      error: err?.message || "Network error. Please try again.",
    };
  }
}

export function generateExamPlan(payload: ExamPlanRequest) {
  return request<ExamPlanResponse>("/exam/generate", payload);
}

export function generateWeeklyPlan(payload: WeeklyPlanRequest) {
  return request<WeeklyPlanResponse>("/weekly/generate", payload);
}
