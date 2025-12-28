from datetime import date
from typing import Dict, Any, List

from fastapi import APIRouter, HTTPException

from .schemas import WeeklyPlanRequestV2, WeeklyPlanResponse
from core.allocator.weekly_allocator import generate_weekly_plan

router = APIRouter(prefix="/weekly", tags=["weekly"])


def _validate_weekly_subjects(payload: WeeklyPlanRequestV2) -> None:
    """Validate weekly subjects: hours, names, etc."""
    if not payload.weekly_subjects or len(payload.weekly_subjects) == 0:
        raise HTTPException(400, "At least one weekly subject is required.")

    for subject in payload.weekly_subjects:
        if subject.hours_per_week <= 0:
            raise HTTPException(
                400,
                f"Hours per week must be greater than zero for subject '{subject.name}'."
            )


def _ensure_availability_start_date(payload: WeeklyPlanRequestV2) -> Dict[str, Any]:
    """
    Ensure availability has a start_date.
    If not provided by the client, default to today.
    """
    availability = payload.availability.dict()
    if not availability.get("start_date"):
        availability["start_date"] = date.today().isoformat()
    return availability


@router.post("/generate", response_model=WeeklyPlanResponse)
def generate_weekly_plan_endpoint(payload: WeeklyPlanRequestV2) -> WeeklyPlanResponse:
    """
    V2 endpoint: accepts rich weekly planning input with:
    - multiple weekly subjects
    - topics with difficulty/familiarity/priority/confidence
    - availability
    - optional settings
    """

    # Validate weekly subjects
    _validate_weekly_subjects(payload)

    # Ensure availability has a start_date
    availability_dict = _ensure_availability_start_date(payload)

    # Build subjects list for allocator
    subjects_for_allocator: List[Dict[str, Any]] = []
    for i, subject in enumerate(payload.weekly_subjects):
        subject_id = subject.id or f"subject-{i+1}"

        topics_for_subject = [topic.dict() for topic in subject.topics]

        subjects_for_allocator.append(
            {
                "id": subject_id,
                "name": subject.name,
                "hours_per_week": subject.hours_per_week,
                "difficulty": subject.difficulty,
                "familiarity": subject.familiarity,
                "priority": subject.priority,
                "topics": topics_for_subject,
            }
        )

    # Weekly hours = sum of hours_per_week across all subjects
    weekly_hours = float(sum(s.hours_per_week for s in payload.weekly_subjects))

    settings_dict = payload.settings.dict() if payload.settings is not None else None

    plan_dict = generate_weekly_plan(
        subjects=subjects_for_allocator,
        weekly_hours=weekly_hours,
        availability=availability_dict,
        settings=settings_dict,
    )

    return WeeklyPlanResponse(plan=plan_dict)
