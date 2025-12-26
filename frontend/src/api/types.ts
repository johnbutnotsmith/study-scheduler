export interface WeeklyPlanRequest {
  subjects: string[];
  hours_per_day: number;
}

export interface WeeklyPlanResponse {
  week: {
    day: string;
    blocks: { subject: string; duration: number }[];
  }[];
}

export interface ExamPlanRequest {
  exam_date: string;
  topics: string[];
  hours_available: number;
}

export interface ExamPlanResponse {
  schedule: {
    date: string;
    topic: string;
    duration: number;
  }[];
}