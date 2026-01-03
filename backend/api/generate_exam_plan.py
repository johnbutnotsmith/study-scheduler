from datetime import date

from fastapi import APIRouter, HTTPException

from .schemas import ExamPlanRequest, ExamPlanResponse
from core.allocator.exam_allocator import generate_exam_plan

router = APIRouter(prefix="/exam", tags=["exam"])


@router.post("/generate", response_model=ExamPlanResponse)
def generate_exam_plan_endpoint(payload: ExamPlanRequest) -> ExamPlanResponse:
    """
    Unified exam-mode endpoint.

    Accepts (canonical shape):
        {
            "subjects": [
                {
                    "id": Optional[str],
                    "name": str,
                    "exam_date": "YYYY-MM-DD",
                    "difficulty": int (1-5),
                    "confidence": int (1-5),
                    "topics": [
                        {
                            "id": Optional[str],
                            "name": str,
                            "priority": int (1-5),
                            "familiarity": int (1-5)
                        },
                        ...
                    ]
                },
                ...
            ],
            "availability": {
                "minutes_per_weekday": { "Monday": int, ... },
                "rest_dates": [ "YYYY-MM-DD", ... ],
                "start_date": "YYYY-MM-DD",
                "end_date": "YYYY-MM-DD"
            }
        }

    Notes:
    - Subject and topic IDs are optional on input; the allocator guarantees IDs internally.
    - availability.start_date defaults to today if missing.
    - availability.end_date is required in exam mode.
    """

    # Basic validation
    if not payload.subjects:
        raise HTTPException(status_code=400, detail="At least one subject is required.")

    # Normalize availability start_date
    if not payload.availability.start_date:
        payload.availability.start_date = date.today().isoformat()

    # Exam mode requires an explicit end_date (last study day)
    if not payload.availability.end_date:
        raise HTTPException(
            status_code=400,
            detail="Exam mode requires end_date in availability.",
        )

    # Delegate to allocator.
    # The allocator is responsible for:
    # - Parsing exam_date
    # - Generating IDs for subjects/topics if missing
    # - Building the plan dict with days/blocks/subjects/topics
    plan_dict = generate_exam_plan(
      subjects=[s.dict() for s in payload.subjects],
      availability=payload.availability.dict(),
    )

    return ExamPlanResponse(plan=plan_dict)
