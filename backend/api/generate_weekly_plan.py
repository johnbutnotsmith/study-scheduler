from datetime import date
from typing import Dict, Any, List

from fastapi import APIRouter, HTTPException

from .schemas import WeeklyPlanRequest, WeeklyPlanResponse
from core.allocator.weekly_allocator import generate_weekly_plan

router = APIRouter(prefix="/weekly", tags=["weekly"])


@router.post("/generate", response_model=WeeklyPlanResponse)
def generate_weekly_plan_endpoint(payload: WeeklyPlanRequest) -> WeeklyPlanResponse:
    # Validate subjects
    if not payload.subjects or len(payload.subjects) == 0:
        raise HTTPException(400, "At least one subject is required.")

    # Validate hours_per_day
    if payload.hours_per_day <= 0:
        raise HTTPException(400, "Hours per day must be greater than zero.")

    subjects_for_allocator: List[Dict[str, Any]] = [
        {
            "id": f"s{i}",
            "name": name,
            "difficulty": 3,
            "familiarity": 3,
            "topics": [],
        }
        for i, name in enumerate(payload.subjects)
    ]

    weekly_hours: float = float(payload.hours_per_day * 7)

    minutes_per_day = payload.hours_per_day * 60

    availability_for_allocator: Dict[str, Any] = {
        "minutes_per_weekday": {
            "Monday": minutes_per_day,
            "Tuesday": minutes_per_day,
            "Wednesday": minutes_per_day,
            "Thursday": minutes_per_day,
            "Friday": minutes_per_day,
            "Saturday": minutes_per_day,
            "Sunday": minutes_per_day,
        },
        "rest_days": [],
        "start_date": date.today().isoformat(),
    }

    plan_dict = generate_weekly_plan(
        subjects=subjects_for_allocator,
        weekly_hours=weekly_hours,
        availability=availability_for_allocator,
        settings=None,
    )

    return WeeklyPlanResponse(plan=plan_dict)