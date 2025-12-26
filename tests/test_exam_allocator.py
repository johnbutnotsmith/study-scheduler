# tests/test_exam_allocator.py
from datetime import date, timedelta
from backend.core.allocator.exam_allocator import generate_exam_plan

def _mk_date_str(d):
    return d.isoformat()

def test_generate_exam_plan_basic():
    # Two exams, one week window
    today = date.today()
    exams = [
        {
            "id": "e1",
            "subject": "Math",
            "exam_date": _mk_date_str(today + timedelta(days=7)),
            "difficulty": 5,
            "familiarity": 2,
            "topics": [{"id": "t1", "name": "Algebra"}, {"id": "t2", "name": "Geometry"}]
        },
        {
            "id": "e2",
            "subject": "History",
            "exam_date": _mk_date_str(today + timedelta(days=10)),
            "difficulty": 3,
            "familiarity": 4,
            "topics": [{"id": "h1", "name": "WW1"}]
        }
    ]

    availability = {
        "start_date": _mk_date_str(today),
        "end_date": _mk_date_str(today + timedelta(days=6)),
        "minutes_per_weekday": {
            "Monday": 120, "Tuesday": 120, "Wednesday": 120, "Thursday": 120,
            "Friday": 120, "Saturday": 60, "Sunday": 0
        },
        "rest_dates": []
    }

    plan = generate_exam_plan(exams, availability)
    assert isinstance(plan, dict)
    days = plan.get("days", [])
    assert len(days) > 0

    # Each day block should have subject and minutes >= 25 (per allocator heuristic)
    for d in days:
        for b in d.get("blocks", []):
            assert "subject" in b
            assert b.get("minutes", 0) >= 25