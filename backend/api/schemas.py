from pydantic import BaseModel
from typing import List, Dict, Any, Optional


# -----------------------------
# WEEKLY PLAN (frontend-facing)
# -----------------------------

class WeeklyPlanRequest(BaseModel):
    # Simple input from the form
    subjects: List[str]
    hours_per_day: int


class WeeklyPlanResponse(BaseModel):
    # We just wrap whatever the allocator returns
    plan: Dict[str, Any]


# -----------------------------
# EXAM PLAN (frontend-facing)
# -----------------------------

class ExamPlanRequest(BaseModel):
    # Simple input from the form
    topics: List[str]
    exam_date: str              # "YYYY-MM-DD"
    hours_available: int        # total hours across the whole period


class ExamPlanResponse(BaseModel):
    # Wrap allocator output
    plan: Dict[str, Any]