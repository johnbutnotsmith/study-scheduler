from datetime import date, datetime
from typing import Dict, Any, List, Optional

from fastapi import APIRouter, HTTPException

from .schemas import ExamPlanRequest, ExamPlanResponse
from core.allocator.exam_allocator import generate_exam_plan

router = APIRouter(prefix="/exam", tags=["exam"])


def _build_exam_availability(exam_date_str: str, total_hours: int) -> Dict[str, Any]:
    today = date.today()
    try:
        exam_date = datetime.strptime(exam_date_str, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(400, "Invalid exam_date format. Expected YYYY-MM-DD.")

    if total_hours <= 0:
        raise HTTPException(400, "Hours available must be greater than zero.")

    if exam_date < today:
        raise HTTPException(400, "Exam date must be today or in the future.")

    if exam_date == today:
        days_span = 1
        start = exam_date
        end = exam_date
    else:
        days_span = (exam_date - today).days
        start = today
        end = exam_date

    total_minutes = total_hours * 60
    minutes_per_day = total_minutes // max(days_span, 1)

    minutes_per_weekday = {
        "Monday": minutes_per_day,
        "Tuesday": minutes_per_day,
        "Wednesday": minutes_per_day,
        "Thursday": minutes_per_day,
        "Friday": minutes_per_day,
        "Saturday": minutes_per_day,
        "Sunday": minutes_per_day,
    }

    return {
        "start_date": start.isoformat(),
        "end_date": end.isoformat(),
        "minutes_per_weekday": minutes_per_weekday,
        "rest_dates": [],
    }


@router.post("/generate", response_model=ExamPlanResponse)
def generate_exam_plan_endpoint(payload: ExamPlanRequest) -> ExamPlanResponse:
    # Validate topics
    if not payload.topics or len(payload.topics) == 0:
        raise HTTPException(400, "At least one topic is required.")

    # Validate hours
    if payload.hours_available <= 0:
        raise HTTPException(400, "Hours available must be greater than zero.")

    # Validate exam date format
    try:
        datetime.strptime(payload.exam_date, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(400, "Invalid exam_date format. Expected YYYY-MM-DD.")

    topics_for_exam: List[Dict[str, Any]] = [
        {"id": f"t{i}", "name": name}
        for i, name in enumerate(payload.topics)
    ]

    exam_dict = {
        "id": "exam-1",
        "subject": "Exam",
        "exam_date": payload.exam_date,
        "difficulty": 3,
        "familiarity": 3,
        "topics": topics_for_exam,
    }

    availability_dict = _build_exam_availability(
        exam_date_str=payload.exam_date,
        total_hours=payload.hours_available,
    )

    plan_dict = generate_exam_plan(
        exams=[exam_dict],
        availability=availability_dict,
        settings=None,
    )

    return ExamPlanResponse(plan=plan_dict)