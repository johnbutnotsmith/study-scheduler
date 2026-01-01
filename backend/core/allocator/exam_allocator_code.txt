"""
Exam allocator (v2, unified schema)

Generates a multi-exam, multi-subject, deadline-driven study plan.

Public API:
    generate_exam_plan(subjects, availability) -> dict

Conventions:
    - All dates in ISO format: "YYYY-MM-DD"
    - All durations in minutes
    - Input is Python dicts (API layer will validate JSON)

Input schema (exam mode):

{
    "mode": "exam",
    "subjects": [
        {
            "id": "chem_1",
            "name": "Chemistry",
            "difficulty": 4,
            "confidence": 1,
            "exam_date": "2026-01-26",
            "topics": [
                { "id": "t1", "name": "Air and water", "priority": 3, "familiarity": 3 }
            ]
        }
    ],
    "availability": {
        "minutes_per_weekday": {
            "Monday": 240,
            "Tuesday": 240,
            "Wednesday": 240,
            "Thursday": 240,
            "Friday": 240,
            "Saturday": 360,
            "Sunday": 0
        },
        "rest_dates": ["2026-01-01"],
        "start_date": "2025-12-29",
        "end_date": "2026-01-26"
    }
}
"""

from __future__ import annotations
from uuid import uuid4

from dataclasses import dataclass
from datetime import date, datetime, timedelta
from typing import List, Dict, Any, Optional

from .cognitive_load import validate_day_plan
from .fairness import adjust_for_fairness
from ..engine.topic_rotation import pick_next_topic


# ---------- Data structures ----------

@dataclass
class ExamSubject:
    """
    Unified exam subject model for the allocator.

    Maps from unified input subject:
        {
            "id": "chem_1",
            "name": "Chemistry",
            "difficulty": 4,
            "confidence": 1,
            "exam_date": "2026-01-26",
            "topics": [...]
        }
    """
    id: str
    name: str
    exam_date: date
    difficulty: int          # 1–5
    confidence: int          # 1–5 (higher = more confident)
    topics: List[Dict[str, Any]]  # list of topic dicts (id, name, priority, familiarity)


@dataclass
class Availability:
    start_date: date
    end_date: date
    minutes_per_weekday: Dict[str, int]
    rest_dates: List[date]


@dataclass
class AllocatorSettings:
    """
    Internal-only settings; not exposed to the user.
    """
    difficulty_weight: float = 0.5
    confidence_weight: float = 0.3   # low confidence → more time
    urgency_weight: float = 0.2


DEFAULT_SETTINGS = AllocatorSettings()


# ---------- Public API ----------

def generate_exam_plan(
    subjects: List[Dict[str, Any]],
    availability: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Generate a deadline-driven exam plan based on the unified schema.

    Args:
        subjects: list of subject dicts (unified exam-mode subjects).
        availability: unified availability dict.

    Returns:
        {
            "days": [
                {
                    "date": "2025-12-29",
                    "total_minutes": 180,
                    "blocks": [
                        {
                            "minutes": 90,
                            "subjects": [
                                {
                                    "id": "chem_1",
                                    "name": "Chemistry",
                                    "minutes": 90,
                                    "topic": {...},
                                    "difficulty": 4
                                }
                            ]
                        }
                    ]
                }
            ]
        }
    """
    if not subjects:
        return {"days": []}

    exams_model = _parse_subjects_as_exams(subjects)
    availability_model = _parse_availability(availability)

    calendar_days = _build_calendar_days(availability_model)

    if not calendar_days:
        return {"days": []}

    settings = DEFAULT_SETTINGS

    weights = _compute_exam_weights(exams_model, availability_model, settings)
    minutes_per_exam = _allocate_minutes_per_exam(calendar_days, weights)

    raw_plan = _distribute_minutes_into_days(
        calendar_days,
        exams_model,
        minutes_per_exam
    )

    fair_plan = adjust_for_fairness(raw_plan)

    final_days = []
    for day in fair_plan.get("days", []):
        validated = validate_day_plan(day)
        final_days.append(validated)

    return {"days": final_days}


# ---------- Parsing ----------

def _parse_subjects_as_exams(subjects: List[Dict[str, Any]]) -> List[ExamSubject]:
    parsed: List[ExamSubject] = []

    for s in subjects:
        # Generate unique subject ID if missing
        subject_id = s.get("id") or uuid4().hex

        # Parse exam date
        exam_date = _parse_date(s["exam_date"])

        # Parse topics with safe unique IDs
        raw_topics = s.get("topics", [])
        topics = []
        for t in raw_topics:
            topic_id = t.get("id") or uuid4().hex
            topics.append({
                "id": str(topic_id),
                "name": t["name"],
                "priority": int(t["priority"]),
                "familiarity": int(t["familiarity"]),
            })

        # Build the ExamSubject dataclass
        parsed.append(
            ExamSubject(
                id=str(subject_id),
                name=str(s["name"]),
                exam_date=exam_date,
                difficulty=int(s["difficulty"]),
                confidence=int(s["confidence"]),
                topics=topics,
            )
        )

    return parsed

def _parse_availability(data: Dict[str, Any]) -> Availability:
    start = _parse_date(data["start_date"])
    end = _parse_date(data["end_date"])
    mpw = data["minutes_per_weekday"]
    rest_dates_raw = data.get("rest_dates", [])
    rest_dates = [_parse_date(d) for d in rest_dates_raw]

    return Availability(
        start_date=start,
        end_date=end,
        minutes_per_weekday=mpw,
        rest_dates=rest_dates,
    )


def _parse_date(value: str) -> date:
    return datetime.strptime(value, "%Y-%m-%d").date()


# ---------- Calendar ----------

def _build_calendar_days(avail: Availability) -> List[Dict[str, Any]]:
    """
    Build the list of usable days between start_date and end_date,
    skipping rest_dates and weekdays with 0 available minutes.
    """
    days: List[Dict[str, Any]] = []
    current = avail.start_date

    while current <= avail.end_date:
        if current in avail.rest_dates:
            current += timedelta(days=1)
            continue

        weekday_name = current.strftime("%A")
        minutes = avail.minutes_per_weekday.get(weekday_name, 0)

        # 0 minutes = implicit recurring rest day for that weekday
        if minutes <= 0:
            current += timedelta(days=1)
            continue

        days.append(
            {
                "date": current,
                "weekday": weekday_name,
                "available_minutes": minutes,
            }
        )
        current += timedelta(days=1)

    return days


# ---------- Weighting ----------

def _compute_exam_weights(
    exams: List[ExamSubject],
    avail: Availability,
    settings: AllocatorSettings
) -> Dict[str, float]:
    """
    Compute a weight for each exam based on:
      - difficulty (harder → more time)
      - confidence (lower confidence → more time)
      - urgency (closer exam date → more time)
    """
    today = avail.start_date
    weights: Dict[str, float] = {}

    for e in exams:
        days_until = max((e.exam_date - today).days, 1)

        difficulty_score = e.difficulty / 5.0
        # low confidence → high "need"
        confidence_need = (6 - e.confidence) / 5.0
        urgency_score = 1.0 / days_until

        weight = (
            settings.difficulty_weight * difficulty_score
            + settings.confidence_weight * confidence_need
            + settings.urgency_weight * urgency_score
        )

        weights[e.id] = max(weight, 0.0001)

    return weights


def _allocate_minutes_per_exam(
    calendar_days: List[Dict[str, Any]],
    weights: Dict[str, float],
) -> Dict[str, int]:
    """
    Allocate the total available minutes across exams based on their weights.
    """
    total_available = sum(d["available_minutes"] for d in calendar_days)
    total_weight = sum(weights.values())

    if total_weight <= 0:
        equal = total_available // max(len(weights), 1)
        return {exam_id: equal for exam_id in weights.keys()}

    minutes_per_exam: Dict[str, int] = {}
    for exam_id, w in weights.items():
        share = w / total_weight
        minutes_per_exam[exam_id] = int(total_available * share)

    return minutes_per_exam


# ---------- Distribution ----------

def _distribute_minutes_into_days(
    calendar_days: List[Dict[str, Any]],
    exams: List[ExamSubject],
    minutes_per_exam: Dict[str, int]
) -> Dict[str, Any]:
    """
    Distribute each exam's allocated minutes into daily blocks,
    respecting daily availability and exam urgency.

    Produces the unified plan structure:
        {
            "days": [
                {
                    "date": "YYYY-MM-DD",
                    "total_minutes": int,
                    "blocks": [
                        {
                            "minutes": int,
                            "subjects": [
                                {
                                    "id": str,
                                    "name": str,
                                    "minutes": int,
                                    "topic": {...},
                                    "difficulty": int
                                }
                            ]
                        }
                    ]
                }
            ]
        }
    """
    # Sort exams by exam_date (nearest first)
    exams_sorted = sorted(exams, key=lambda e: e.exam_date)

    # Topic state for spaced-repetition topic selection
    topic_state: Dict[str, Dict[str, Any]] = {}

    days_output: List[Dict[str, Any]] = []
    remaining = dict(minutes_per_exam)

    for day in calendar_days:
        day_date: date = day["date"]
        available = day["available_minutes"]

        if available <= 0:
            continue

        # Exams sorted by urgency relative to this day
        exams_by_urgency = sorted(
            exams_sorted,
            key=lambda e: max((e.exam_date - day_date).days, 0)
        )

        day_blocks: List[Dict[str, Any]] = []

        while available > 0:
            # Stop if all exams exhausted
            if all(remaining.get(e.id, 0) <= 0 for e in exams_by_urgency):
                break

            progress_made = False

            for exam in exams_by_urgency:
                if available <= 0:
                    break
                if remaining.get(exam.id, 0) <= 0:
                    continue

                block_minutes = _decide_block_length(exam, remaining[exam.id], available)
                if block_minutes <= 0:
                    continue

                # Use minimal spaced-repetition topic rotation
                topic = pick_next_topic(
                    subject_id=exam.id,       # use exam id as subject key in state
                    topics=exam.topics,
                    state=topic_state,
                    current_date=day_date
                )

                block = {
                    "minutes": block_minutes,
                    "subjects": [
                        {
                            "id": exam.id,
                            "name": exam.name,
                            "minutes": block_minutes,
                            "topic": topic,
                            "difficulty": exam.difficulty,
                        }
                    ],
                }
                day_blocks.append(block)

                remaining[exam.id] = max(remaining[exam.id] - block_minutes, 0)
                available -= block_minutes
                progress_made = True

                if available <= 0:
                    break

            if not progress_made:
                # Cannot allocate more time meaningfully
                break

        if day_blocks:
            days_output.append(
                {
                    "date": day_date.isoformat(),
                    "total_minutes": sum(
                        sum(s["minutes"] for s in block["subjects"])
                        for block in day_blocks
                    ),
                    "blocks": day_blocks,
                }
            )

    return {"days": days_output}


def _decide_block_length(
    exam: ExamSubject,
    remaining_for_exam: int,
    remaining_for_day: int
) -> int:
    """
    Decide a single block length for this exam on this day
    based on exam difficulty and remaining minutes.
    """
    if exam.difficulty >= 4:
        preferred = 75
    elif exam.difficulty == 3:
        preferred = 60
    else:
        preferred = 45

    block = min(preferred, remaining_for_exam, remaining_for_day)

    if block <= 0:
        return 0

    # allow small tail fragments rather than dropping them
    if block < 25:
        return block

    return block
