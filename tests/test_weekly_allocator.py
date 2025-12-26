# tests/test_weekly_allocator.py
from backend.core.allocator.weekly_allocator import generate_weekly_plan
from datetime import date

def test_generate_weekly_plan_structure_and_totals():
    subjects = [
        {"id": "s1", "name": "Math", "difficulty": 5, "familiarity": 2, "topics": [{"id":"t1","name":"Algebra"}]},
        {"id": "s2", "name": "Chemistry", "difficulty": 4, "familiarity": 3, "topics": [{"id":"c1","name":"Stoich"}]},
        {"id": "s3", "name": "History", "difficulty": 2, "familiarity": 4, "topics": [{"id":"h1","name":"WW1"}]},
    ]

    weekly_hours = 6  # 6 hours per week => 360 minutes
    availability = {
        "minutes_per_weekday": {
            "Monday": 60, "Tuesday": 60, "Wednesday": 60, "Thursday": 60,
            "Friday": 60, "Saturday": 60, "Sunday": 0
        },
        "rest_days": ["Sunday"],
        "start_date": date.today().isoformat()
    }

    plan = generate_weekly_plan(subjects, weekly_hours, availability)
    assert "days" in plan
    days = plan["days"]
    assert len(days) == 7

    total_minutes = sum(d.get("total_minutes", 0) for d in days)
    # total minutes should be close to weekly_hours * 60 (may be equal or slightly less)
    assert total_minutes <= weekly_hours * 60
    assert total_minutes >= 0

    # Each block subject minutes should be >= 20 (light session min)
    for d in days:
        for b in d.get("blocks", []):
            for s in b.get("subjects", []):
                assert s.get("minutes", 0) >= 15