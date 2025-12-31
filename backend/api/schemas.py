from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


# ============================================================
# SHARED MODELS (unified schema)
# ============================================================

class TopicModel(BaseModel):
    id: Optional[str] = None
    name: str
    priority: int = Field(default=3, ge=1, le=5)
    familiarity: int = Field(default=3, ge=1, le=5)


class ExamAvailabilityModel(BaseModel):
    minutes_per_weekday: Dict[str, int]
    rest_dates: List[str] = []
    start_date: str  # "YYYY-MM-DD"
    end_date: str    # "YYYY-MM-DD"


class WeeklyAvailabilityModel(BaseModel):
    minutes_per_weekday: Dict[str, int]
    rest_dates: List[str] = []
    start_date: str  # "YYYY-MM-DD"


# ============================================================
# EXAM PLAN (unified)
# ============================================================

class ExamSubjectModel(BaseModel):
    id: Optional[str] = None
    name: str
    exam_date: str
    difficulty: int = Field(default=3, ge=1, le=5)
    confidence: int = Field(default=3, ge=1, le=5)
    topics: List[TopicModel] = []


class ExamPlanRequest(BaseModel):
    subjects: List[ExamSubjectModel]
    availability: ExamAvailabilityModel


class ExamPlanResponse(BaseModel):
    plan: Dict[str, Any]


# ============================================================
# WEEKLY PLAN (unified)
# ============================================================

class WeeklySubjectModel(BaseModel):
    id: Optional[str] = None
    name: str
    difficulty: int = Field(default=3, ge=1, le=5)
    confidence: int = Field(default=3, ge=1, le=5)
    topics: List[TopicModel] = []


class WeeklyPlanRequest(BaseModel):
    subjects: List[WeeklySubjectModel]
    weekly_hours: float
    availability: WeeklyAvailabilityModel


class WeeklyPlanResponse(BaseModel):
    plan: Dict[str, Any]