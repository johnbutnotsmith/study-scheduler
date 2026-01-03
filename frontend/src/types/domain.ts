// frontend/src/types/domain.ts

// ---------- Core primitives ----------

export type Weekday =
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday"
  | "Saturday"
  | "Sunday";

// ---------- Input domain types (shared FE/BE intent) ----------

export interface Topic {
  // Optional on input; backend generates UUID when missing.
  id?: string;
  name: string;
  // 1–5
  priority: number;
  // 1–5
  familiarity: number;
}

export interface SubjectBase {
  // Optional on input; backend generates UUID when missing.
  id?: string;
  name: string;
  // 1–5
  difficulty: number;
  // 1–5
  confidence: number;
  topics?: Topic[];
}

// Exam mode: each subject has its own exam date.
export interface ExamSubject extends SubjectBase {
  exam_date: string; // "YYYY-MM-DD"
}

// Weekly mode: same subject shape, no exam_date.
export type WeeklySubject = SubjectBase;

export interface AvailabilityBase {
  minutes_per_weekday: Record<Weekday, number>;
  // "YYYY-MM-DD"; ensured non-empty before sending to backend.
  start_date: string;
  // Concrete dates to skip, "YYYY-MM-DD".
  rest_dates: string[];
}

// Exam: requires end_date (last study day, day before exam).
export interface ExamAvailability extends AvailabilityBase {
  end_date: string;
}

// Weekly: backend doesn’t require end_date, but FE currently computes it
// as start_date + 6. We keep it optional to reflect backend truth while
// allowing FE to send it.
export interface WeeklyAvailability extends AvailabilityBase {
  end_date?: string;
}

// ---------- Request payloads ----------

export interface ExamPlanRequest {
  subjects: ExamSubject[];
  availability: ExamAvailability;
}

export interface WeeklyPlanRequest {
  subjects: WeeklySubject[];
  weekly_hours: number;
  availability: WeeklyAvailability;
}

// ---------- Allocator / API output types ----------

// Shared topic shape in outputs: IDs are always present.
export interface PlanTopic {
  id: string;
  name: string;
  priority: number;
  familiarity: number;
}

// Subject inside a block (exam mode: single subject per block).
export interface ExamBlockSubject {
  id: string;
  name: string;
  minutes: number;
  topic: PlanTopic;
  difficulty: number;
}

export interface ExamPlanBlock {
  minutes: number;
  subject: ExamBlockSubject;
}

export interface ExamPlanDay {
  date: string; // "YYYY-MM-DD"
  weekday: Weekday;
  total_minutes: number;
  blocks: ExamPlanBlock[];
}

export interface ExamPlan {
  days: ExamPlanDay[];
}

// Weekly mode: blocks can contain multiple subjects.
export interface WeeklyBlockSubject {
  id: string;
  name: string;
  minutes: number;
  topic: PlanTopic;
  difficulty: number;
}

export interface WeeklyPlanBlock {
  minutes: number;
  subjects: WeeklyBlockSubject[];
}

export interface WeeklyPlanDay {
  date: string; // "YYYY-MM-DD"
  weekday: Weekday;
  total_minutes: number;
  blocks: WeeklyPlanBlock[];
}

export interface WeeklyPlan {
  week_start: string; // "YYYY-MM-DD"
  days: WeeklyPlanDay[];
}

// API response envelopes (current backend behavior: { plan: { ... } })

export interface ExamPlanResponse {
  plan: ExamPlan;
}

export interface WeeklyPlanResponse {
  plan: WeeklyPlan;
}
