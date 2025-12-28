from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional


# ============================================================
# SHARED MODELS
# ============================================================

class TopicModel(BaseModel):
    id: Optional[str] = None
    name: str
    difficulty: Optional[int] = Field(default=3, ge=1, le=5)
    familiarity: Optional[int] = Field(default=3, ge=1, le=5)
    priority: Optional[str] = Field(default="medium")   # "low", "medium", "high"
    confidence: Optional[int] = Field(default=3, ge=1, le=5)


class SettingsModel(BaseModel):
    daily_study_limit_hours: Optional[int] = 4
    max_session_length_minutes: Optional[int] = 50
    break_length_minutes: Optional[int] = 10
    cognitive_load_sensitivity: Optional[int] = Field(default=3, ge=1, le=5)
    auto_rebalance: Optional[bool] = True


class AvailabilityModel(BaseModel):
    minutes_per_weekday: Dict[str, int]
    rest_days: Optional[List[str]] = []
    start_date: Optional[str] = None   # "YYYY-MM-DD"


# ============================================================
# EXAM PLAN (V2)
# ============================================================

class ExamSubjectModel(BaseModel):
    id: Optional[str] = None
    subject: str
    exam_date: str
    hours_available: int
    difficulty: Optional[int] = Field(default=3, ge=1, le=5)
    familiarity: Optional[int] = Field(default=3, ge=1, le=5)
    priority: Optional[str] = Field(default="medium")
    topics: List[TopicModel] = []


class ExamPlanRequestV2(BaseModel):
    exams: List[ExamSubjectModel]
    availability: AvailabilityModel
    settings: Optional[SettingsModel] = None


class ExamPlanResponse(BaseModel):
    plan: Dict[str, Any]


# ============================================================
# WEEKLY PLAN (V2)
# ============================================================

class WeeklySubjectModel(BaseModel):
    id: Optional[str] = None
    name: str
    hours_per_week: int
    difficulty: Optional[int] = Field(default=3, ge=1, le=5)
    familiarity: Optional[int] = Field(default=3, ge=1, le=5)
    priority: Optional[str] = Field(default="medium")
    topics: List[TopicModel] = []


class WeeklyPlanRequestV2(BaseModel):
    weekly_subjects: List[WeeklySubjectModel]
    availability: AvailabilityModel
    settings: Optional[SettingsModel] = None


class WeeklyPlanResponse(BaseModel):
    plan: Dict[str, Any]


# ============================================================
# BACKWARD COMPATIBILITY (V1)
# ============================================================

class WeeklyPlanRequest(BaseModel):
    subjects: List[str]
    hours_per_day: int


class ExamPlanRequest(BaseModel):
    topics: List[str]
    exam_date: str
    hours_available: int