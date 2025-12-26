"""
Exam allocator

Generates a multi-exam, multi-subject, deadline-driven study plan.

Public API:
    generate_exam_plan(exams, availability, settings=None) -> dict

Conventions:
    - All dates in ISO format: "YYYY-MM-DD"
    - All durations in minutes
    - Input is Python dicts (API layer will validate JSON)
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime, timedelta
from typing import List, Dict, Any, Optional

# These modules will live in the same core/allocator or core/engine package.
# For now, we assume the following functions exist and are imported correctly:
#
#   from .cognitive_load import validate_day_plan
#   from .fairness import adjust_for_fairness
#   from ..engine.topic_rotation import pick_next_topic
#
# You can stub them initially and implement later.
try:
    from .cognitive_load import validate_day_plan  # type: ignore
except ImportError:
    def validate_day_plan(day_plan: Dict[str, Any]) -> Dict[str, Any]:
        # Temporary no-op fallback
        return day_plan

try:
    from .fairness import adjust_for_fairness  # type: ignore
except ImportError:
    def adjust_for_fairness(weekly_or_global_plan: Dict[str, Any]) -> Dict[str, Any]:
        # Temporary no-op fallback
        return weekly_or_global_plan

try:
    from ..engine.topic_rotation import pick_next_topic  # type: ignore
except ImportError:
    def pick_next_topic(subject_name: str, topics: List[Dict[str, Any]], state: Dict[str, Any]) -> Dict[str, Any]:
        # Simple round-robin fallback
        index = state.get(subject_name, 0)
        if not topics:
            return {"name": "General review", "id": None}
        topic = topics[index % len(topics)]
        state[subject_name] = (index + 1) % len(topics)
        return topic


# ---------- Data structures ----------

@dataclass
class Exam:
    id: str
    subject: str
    exam_date: date
    difficulty: int          # 1–5
    familiarity: int         # 1–5 (higher = more familiar)
    topics: List[Dict[str, Any]]  # list of topic dicts (id, name, etc.)


@dataclass
class Availability:
    start_date: date
    end_date: date
    minutes_per_weekday: Dict[str, int]
    rest_dates: List[date]


@dataclass
class AllocatorSettings:
    max_daily_minutes: Optional[int] = None
    difficulty_weight: float = 0.5
    unfamiliarity_weight: float = 0.3
    urgency_weight: float = 0.2


# ---------- Public API ----------

def generate_exam_plan(
    exams: List[Dict[str, Any]],
    availability: Dict[str, Any],
    settings: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:

    if not exams:
        return {"days": []}

    exams_model = _parse_exams(exams)
    availability_model = _parse_availability(availability)
    settings_model = _parse_settings(settings)

    calendar_days = _build_calendar_days(availability_model)

    weights = _compute_exam_weights(exams_model, availability_model, settings_model)
    minutes_per_exam = _allocate_minutes_per_exam(calendar_days, weights, settings_model)

    raw_plan = _distribute_minutes_into_days(
        calendar_days,
        exams_model,
        minutes_per_exam
    )

    fair_plan = adjust_for_fairness(raw_plan)

    final_days = []
    for day in fair_plan["days"]:
        validated = validate_day_plan(day)

        # FINAL FIX: authoritative recomputation of total_minutes
        blocks = validated.get("blocks", [])
        validated["total_minutes"] = sum(b.get("minutes", 0) for b in blocks)

        final_days.append(validated)

    return {"days": final_days}


# ---------- Parsing ----------

def _parse_exams(exams: List[Dict[str, Any]]) -> List[Exam]:
    parsed: List[Exam] = []
    for e in exams:
        exam_date = _parse_date(e["exam_date"])
        topics = e.get("topics", [])
        parsed.append(
            Exam(
                id=str(e["id"]),
                subject=str(e["subject"]),
                exam_date=exam_date,
                difficulty=int(e["difficulty"]),
                familiarity=int(e["familiarity"]),
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


def _parse_settings(data: Optional[Dict[str, Any]]) -> AllocatorSettings:
    if data is None:
        return AllocatorSettings()
    return AllocatorSettings(
        max_daily_minutes=data.get("max_daily_minutes"),
        difficulty_weight=data.get("difficulty_weight", 0.5),
        unfamiliarity_weight=data.get("unfamiliarity_weight", 0.3),
        urgency_weight=data.get("urgency_weight", 0.2),
    )


def _parse_date(value: str) -> date:
    return datetime.strptime(value, "%Y-%m-%d").date()


# ---------- Calendar ----------

def _build_calendar_days(avail: Availability) -> List[Dict[str, Any]]:
    days: List[Dict[str, Any]] = []
    current = avail.start_date
    while current <= avail.end_date:
        if current in avail.rest_dates:
            current += timedelta(days=1)
            continue

        weekday_name = current.strftime("%A")
        minutes = avail.minutes_per_weekday.get(weekday_name, 0)
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
    exams: List[Exam],
    avail: Availability,
    settings: AllocatorSettings
) -> Dict[str, float]:

    today = avail.start_date
    weights: Dict[str, float] = {}

    for e in exams:
        days_until = max((e.exam_date - today).days, 1)

        difficulty_score = e.difficulty / 5.0
        unfamiliarity_score = (6 - e.familiarity) / 5.0
        urgency_score = 1.0 / days_until

        weight = (
            settings.difficulty_weight * difficulty_score
            + settings.unfamiliarity_weight * unfamiliarity_score
            + settings.urgency_weight * urgency_score
        )
        weights[e.id] = max(weight, 0.0001)

    return weights


def _allocate_minutes_per_exam(
    calendar_days: List[Dict[str, Any]],
    weights: Dict[str, float],
    settings: AllocatorSettings
) -> Dict[str, int]:

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
    exams: List[Exam],
    minutes_per_exam: Dict[str, int]
) -> Dict[str, Any]:

    exams_sorted = sorted(exams, key=lambda e: e.exam_date)
    topic_state: Dict[str, int] = {}
    days_output: List[Dict[str, Any]] = []
    remaining = dict(minutes_per_exam)

    for day in calendar_days:
        day_date: date = day["date"]
        available = day["available_minutes"]

        if available <= 0:
            continue

        exams_by_urgency = sorted(
            exams_sorted,
            key=lambda e: max((e.exam_date - day_date).days, 0)
        )

        day_blocks: List[Dict[str, Any]] = []

        while available > 0:
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

                topic = pick_next_topic(
                    exam.subject,
                    exam.topics,
                    topic_state
                )

                block = {
                    "start": None,
                    "end": None,
                    "subject": exam.subject,
                    "exam_id": exam.id,
                    "topic": topic,
                    "minutes": block_minutes,
                }
                day_blocks.append(block)

                remaining[exam.id] = max(remaining[exam.id] - block_minutes, 0)
                available -= block_minutes
                progress_made = True

                if available <= 0:
                    break

            if not progress_made:
                break

        if day_blocks:
            days_output.append(
                {
                    "date": day_date.isoformat(),
                    "total_minutes": sum(b["minutes"] for b in day_blocks),
                    "blocks": day_blocks,
                }
            )

    return {"days": days_output}


def _decide_block_length(
    exam: Exam,
    remaining_for_exam: int,
    remaining_for_day: int
) -> int:

    if exam.difficulty >= 4:
        preferred = 75
    elif exam.difficulty == 3:
        preferred = 60
    else:
        preferred = 45

    block = min(preferred, remaining_for_exam, remaining_for_day)

    if block <= 0:
        return 0

    if block < 25:
        return block

    return block
