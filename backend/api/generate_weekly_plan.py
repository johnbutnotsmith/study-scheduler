from datetime import date

from fastapi import APIRouter, HTTPException

from .schemas import WeeklyPlanRequest, WeeklyPlanResponse
from core.allocator.weekly_allocator import generate_weekly_plan

router = APIRouter(prefix="/weekly", tags=["weekly"])


@router.post("/generate", response_model=WeeklyPlanResponse)
def generate_weekly_plan_endpoint(payload: WeeklyPlanRequest) -> WeeklyPlanResponse:
    """
    Unified weekly-mode endpoint.

    Accepts (canonical shape):
        {
            "subjects": [
                {
                    "id": Optional[str],
                    "name": str,
                    "difficulty": int (1-5),
                    "confidence": int (1-5),
                    "topics": [
                        {
                            "id": Optional[str],
                            "name": str,
                            "priority": int (1-5),
                            "familiarity": int (1-5)
                        }
                    ]
                }
            ],
            "weekly_hours": float,
            "availability": {
                "minutes_per_weekday": { "Monday": int, ... },
                "rest_dates": [ "YYYY-MM-DD", ... ],
                "start_date": "YYYY-MM-DD",
                "end_date": Optional["YYYY-MM-DD"]   # accepted but not required
            }
        }

    Notes:
    - Subject/topic IDs are optional; allocator generates them if missing.
    - weekly_hours must be > 0.
    - start_date defaults to today if missing.
    - end_date is optional in weekly mode (frontend sends it; backend accepts it).
    """

    # Basic validation
    if not payload.subjects:
        raise HTTPException(status_code=400, detail="At least one subject is required.")

    if payload.weekly_hours <= 0:
        raise HTTPException(status_code=400, detail="weekly_hours must be > 0.")

    # Normalize start_date
    if not payload.availability.start_date:
        payload.availability.start_date = date.today().isoformat()

    # Delegate to allocator.
    # Allocator handles:
    # - ID generation for subjects/topics
    # - Weekly minutes distribution
    # - Cognitive load rules
    # - Fairness adjustments
    plan_dict = generate_weekly_plan(
        subjects=[s.dict() for s in payload.subjects],
        weekly_hours=payload.weekly_hours,
        availability=payload.availability.dict(),
    )

    return WeeklyPlanResponse(plan=plan_dict)
