// ============================================================
// Unified Frontend Types (Aligned with backend schemas.py)
// ============================================================

// -----------------------------
// Topic (shared)
// -----------------------------
export interface Topic {
  id?: string | null;
  name: string;
  priority: number;      // 1–5
  familiarity: number;   // 1–5
}

// -----------------------------
// Exam Mode Types
// -----------------------------
export interface ExamSubject {
  id?: string | null;
  name: string;
  exam_date: string;     // "YYYY-MM-DD"
  difficulty: number;    // 1–5
  confidence: number;    // 1–5
  topics: Topic[];
}

export interface ExamAvailability {
  minutes_per_weekday: Record<string, number>;
  rest_dates: string[];
  start_date: string;    // "YYYY-MM-DD"
  end_date: string;      // "YYYY-MM-DD"
}

export interface ExamPlanRequest {
  subjects: ExamSubject[];
  availability: ExamAvailability;
}

export interface ExamPlanResponse {
  plan: Record<string, any>;
}

// -----------------------------
// Weekly Mode Types
// -----------------------------
export interface WeeklySubject {
  id?: string | null;
  name: string;
  difficulty: number;    // 1–5
  confidence: number;    // 1–5
  topics: Topic[];
}

export interface WeeklyAvailability {
  minutes_per_weekday: Record<string, number>;
  rest_dates: string[];
  start_date: string;    // "YYYY-MM-DD"
}

export interface WeeklyPlanRequest {
  subjects: WeeklySubject[];
  weekly_hours: number;
  availability: WeeklyAvailability;
}

export interface WeeklyPlanResponse {
  plan: Record<string, any>;
}



export interface ApiSuccess<T> {
  ok: true;
  data: T;
}

export interface ApiError {
  ok: false;
  error: string;
}

export type ApiResult<T> = ApiSuccess<T> | ApiError;
