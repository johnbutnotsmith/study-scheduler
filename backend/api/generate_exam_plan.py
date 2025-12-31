from datetime import date
from typing import Dict, Any, List

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from .schemas import ExamPlanResponse
from core.allocator.exam_allocator import generate_exam_plan

router = APIRouter(prefix="/exam", tags=["exam"])


# -------------------------------
# Request model for unified schema
# -------------------------------
class ExamPlanRequest(BaseModel):
    subjects: List[Dict[str, Any]]
    availability: Dict[str, Any]


# -------------------------------
# Endpoint
# -------------------------------
@router.post("/generate", response_model=ExamPlanResponse)
def generate_exam_plan_endpoint(payload: ExamPlanRequest) -> ExamPlanResponse:
    """
    Unified exam-mode endpoint.
    Accepts:
        {
            "subjects": [...],
            "availability": {...}
        }
    """

    # Basic validation
    if not payload.subjects:
        raise HTTPException(400, "At least one subject is required.")

    if "start_date" not in payload.availability:
        payload.availability["start_date"] = date.today().isoformat()

    if "end_date" not in payload.availability:
        raise HTTPException(400, "Exam mode requires end_date in availability.")

    # Call allocator
    plan_dict = generate_exam_plan(
        subjects=payload.subjects,
        availability=payload.availability,
    )

    return ExamPlanResponse(plan=plan_dict)
