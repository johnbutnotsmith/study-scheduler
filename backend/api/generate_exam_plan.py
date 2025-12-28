from datetime import date, datetime
from typing import Dict, Any, List

from fastapi import APIRouter, HTTPException

from .schemas import ExamPlanRequestV2, ExamPlanResponse
from core.allocator.exam_allocator import generate_exam_plan

router = APIRouter(prefix="/exam", tags=["exam"])


def _validate_exam_dates_and_hours(payload: ExamPlanRequestV2) -> None:
    """Basic validation for exams: dates and hours."""
    today = date.today()

    if not payload.exams or len(payload.exams) == 0:
        raise HTTPException(400, "At least one exam is required.")

    for exam in payload.exams:
        # Validate hours
        if exam.hours_available <= 0:
            raise HTTPException(
                400,
                f"Hours available must be greater than zero for exam '{exam.subject}'.",
            )

        # Validate exam date format and that it's today or in the future
        try:
            exam_date = datetime.strptime(exam.exam_date, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(
                400,
                f"Invalid exam_date format for exam '{exam.subject}'. Expected YYYY-MM-DD.",
            )

        if exam_date < today:
            raise HTTPException(
                400,
                f"Exam date for '{exam.subject}' must be today or in the future.",
            )


def _ensure_availability_start_date(payload: ExamPlanRequestV2) -> Dict[str, Any]:
    """
    Ensure availability has a start_date.
    If not provided by the client, default to today.
    """
    availability = payload.availability.dict()
    if not availability.get("start_date"):
        availability["start_date"] = date.today().isoformat()
    return availability


@router.post("/generate", response_model=ExamPlanResponse)
def generate_exam_plan_endpoint(payload: ExamPlanRequestV2) -> ExamPlanResponse:
    """
    V2 endpoint: accepts rich exam input with:
    - multiple exams
    - topics with difficulty/familiarity/priority/confidence
    - availability
    - optional settings
    """

    # Validate exams (dates and hours)
    _validate_exam_dates_and_hours(payload)

    # Ensure availability has a start_date
    availability_dict = _ensure_availability_start_date(payload)

    # Build exams list for allocator
    exams_for_allocator: List[Dict[str, Any]] = []
    for i, exam in enumerate(payload.exams):
        exam_id = exam.id or f"exam-{i+1}"

        topics_for_exam = [topic.dict() for topic in exam.topics]

        exams_for_allocator.append(
            {
                "id": exam_id,
                "subject": exam.subject,
                "exam_date": exam.exam_date,
                "hours_available": exam.hours_available,
                "difficulty": exam.difficulty,
                "familiarity": exam.familiarity,
                "priority": exam.priority,
                "topics": topics_for_exam,
            }
        )

    settings_dict = payload.settings.dict() if payload.settings is not None else None

    plan_dict = generate_exam_plan(
        exams=exams_for_allocator,
        availability=availability_dict,
        settings=settings_dict,
    )

    return ExamPlanResponse(plan=plan_dict)