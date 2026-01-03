from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


# ============================================================
# SHARED MODELS (unified schema)
# ============================================================


class TopicModel(BaseModel):
    """
    Topic shape, aligned with frontend `Topic` / `PlanTopic`:
    - id is optional on input; backend generates it when missing.
    """
    id: Optional[str] = None
    name: str
    priority: int = Field(default=3, ge=1, le=5)
    familiarity: int = Field(default=3, ge=1, le=5)


class ExamAvailabilityModel(BaseModel):
    """
    Availability for exam mode:
    - minutes_per_weekday: map of weekday name -> minutes
    - rest_dates: concrete dates to skip, "YYYY-MM-DD"
    - start_date: global start date
    - end_date: last study day (day before exam)
    """
    minutes_per_weekday: Dict[str, int]
    rest_dates: List[str] = Field(default_factory=list)
    start_date: str  # "YYYY-MM-DD"
    end_date: str    # "YYYY-MM-DD"


class WeeklyAvailabilityModel(BaseModel):
    """
    Availability for weekly mode:
    - minutes_per_weekday: map of weekday name -> minutes
    - rest_dates: concrete dates to skip, "YYYY-MM-DD"
    - start_date: week start
    - end_date: optional 7-day window end (frontend sends it; backend may ignore)
    """
    minutes_per_weekday: Dict[str, int]
    rest_dates: List[str] = Field(default_factory=list)
    start_date: str  # "YYYY-MM-DD"
    # Frontend currently computes and sends this; allocator does not require it,
    # but we accept it to avoid validation errors.
    end_date: Optional[str] = None


# ============================================================
# EXAM PLAN (unified)
# ============================================================


class ExamSubjectModel(BaseModel):
    """
    Subject in exam mode:
    - id is optional on input; backend generates UUID if missing
    - exam_date is the actual exam day
    """
    id: Optional[str] = None
    name: str
    exam_date: str  # "YYYY-MM-DD"
    difficulty: int = Field(default=3, ge=1, le=5)
    confidence: int = Field(default=3, ge=1, le=5)
    topics: List[TopicModel] = Field(default_factory=list)


class ExamPlanRequest(BaseModel):
    """
    Request body for POST /exam/generate:
    - subjects: list of exam subjects
    - availability: exam availability window
    """
    subjects: List[ExamSubjectModel]
    availability: ExamAvailabilityModel


class ExamPlanResponse(BaseModel):
    """
    Response body for POST /exam/generate:
    - plan: dict consumed by ExamTimeline (days -> blocks)
    """
    plan: Dict[str, Any]


# ============================================================
# WEEKLY PLAN (unified)
# ============================================================


class WeeklySubjectModel(BaseModel):
    """
    Subject in weekly mode:
    - id is optional on input; backend generates UUID if missing
    - no exam_date in weekly mode
    """
    id: Optional[str] = None
    name: str
    difficulty: int = Field(default=3, ge=1, le=5)
    confidence: int = Field(default=3, ge=1, le=5)
    topics: List[TopicModel] = Field(default_factory=list)


class WeeklyPlanRequest(BaseModel):
    """
    Request body for POST /weekly/generate:
    - subjects: list of weekly subjects
    - weekly_hours: total hours per week
    - availability: weekly availability
    """
    subjects: List[WeeklySubjectModel]
    weekly_hours: float
    availability: WeeklyAvailabilityModel


class WeeklyPlanResponse(BaseModel):
    """
    Response body for POST /weekly/generate:
    - plan: dict consumed by WeeklyTimeline (week_start + days -> blocks)
    """
    plan: Dict[str, Any]
