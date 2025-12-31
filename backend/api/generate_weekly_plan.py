from datetime import date
from typing import Dict, Any, List

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from .schemas import WeeklyPlanResponse
from core.allocator.weekly_allocator import generate_weekly_plan

router = APIRouter(prefix="/weekly", tags=["weekly"])


# -------------------------------
# Request model for unified schema
# -------------------------------
class WeeklyPlanRequest(BaseModel):
    subjects: List[Dict[str, Any]]
    weekly_hours: float
    availability: Dict[str, Any]


# -------------------------------
# Endpoint
# -------------------------------
@router.post("/generate", response_model=WeeklyPlanResponse)
def generate_weekly_plan_endpoint(payload: WeeklyPlanRequest) -> WeeklyPlanResponse:
    """
    Unified weekly-mode endpoint.
    Accepts:
        {
            "subjects": [...],
            "weekly_hours": float,
            "availability": {...}
        }
    """

    if not payload.subjects:
        raise HTTPException(400, "At least one subject is required.")

    if payload.weekly_hours <= 0:
        raise HTTPException(400, "weekly_hours must be > 0.")

    if "start_date" not in payload.availability:
        payload.availability["start_date"] = date.today().isoformat()

    # Call allocator
    plan_dict = generate_weekly_plan(
        subjects=payload.subjects,
        weekly_hours=payload.weekly_hours,
        availability=payload.availability,
    )

    return WeeklyPlanResponse(plan=plan_dict)