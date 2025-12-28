// -----------------------------
// Topic (shared between exam + weekly)
// -----------------------------
export interface TopicSpec {
  id?: string | null;
  name: string;
  difficulty: number;      // 1–5
  familiarity: number;     // 1–5
  priority: string;        // "low" | "medium" | "high"
  confidence: number;      // 1–5
}

// -----------------------------
// Exam Planning (V2)
// -----------------------------
export interface ExamSpec {
  id?: string;
  subject: string;
  exam_date: string;       // "YYYY-MM-DD"
  hours_available: number;
  difficulty: number;      // 1–5
  familiarity: number;     // 1–5
  priority: string;        // "low" | "medium" | "high"
  topics: TopicSpec[];
}

export interface AvailabilitySpec {
  start_date: string;      // "YYYY-MM-DD"
  end_date: string;        // "YYYY-MM-DD"
  minutes_per_weekday: Record<string, number>;
  rest_dates: string[];
}

export interface AllocatorSettings {
  max_daily_minutes: number;
  difficulty_weight: number;
  unfamiliarity_weight: number;
  urgency_weight: number;
}

export interface ExamPlanRequestV2 {
  exams: ExamSpec[];
  availability: AvailabilitySpec;
  settings: AllocatorSettings;
}

// -----------------------------
// Weekly Planning (V2)
// -----------------------------
export interface WeeklySubjectSpec {
  id?: string;
  name: string;
  hours_per_week: number;
  difficulty: number;      // 1–5
  familiarity: number;     // 1–5
  priority: string;        // "low" | "medium" | "high"
  topics: TopicSpec[];
}

export interface WeeklyAvailabilitySpec {
  start_date: string;      // "YYYY-MM-DD"
  minutes_per_weekday: Record<string, number>;
  rest_days: string[];
}

export interface WeeklySettings {
  min_light_session: number;
  max_subjects_per_day: number;
  max_subjects_per_block: number;
  deep_work_min: number;
  deep_work_max: number;
  medium_min: number;
  medium_max: number;
  light_min: number;
  light_max: number;
  min_sessions_per_subject_per_week: number;
  max_sessions_per_subject_per_week: number;
  difficulty_weight: number;
  unfamiliarity_weight: number;
  max_daily_minutes: number;
}

export interface WeeklyPlanRequestV2 {
  weekly_subjects: WeeklySubjectSpec[];
  availability: WeeklyAvailabilitySpec;
  settings: WeeklySettings;
}