# backend/core/allocator/weekly_allocator.py
from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime, timedelta
from typing import List, Dict, Any, Optional, Tuple
import math

from .cognitive_load import validate_day_plan, validate_block
from .fairness import adjust_for_fairness
from ..engine.topic_rotation import pick_next_topic


# ---------------------------------------------------------
# Data models (aligned with unified schema)
# ---------------------------------------------------------

@dataclass
class WeeklySubject:
    """
    Unified weekly subject model.
    """
    id: str
    name: str
    difficulty: int
    confidence: int
    topics: List[Dict[str, Any]]


@dataclass
class WeeklyAvailability:
    minutes_per_weekday: Dict[str, int]
    rest_dates: List[date]
    start_date: date


@dataclass
class WeeklySettings:
    """
    Internal-only settings (not user-facing).
    """
    min_light_session: int = 20

    max_subjects_per_day: int = 3
    max_subjects_per_block: int = 2

    deep_work_min: int = 60
    deep_work_max: int = 90
    medium_min: int = 40
    medium_max: int = 60
    light_min: int = 20
    light_max: int = 40

    min_sessions_per_subject_per_week: int = 1
    max_sessions_per_subject_per_week: Optional[int] = None

    difficulty_weight: float = 0.6
    confidence_weight: float = 0.4

    max_daily_minutes: Optional[int] = None


DEFAULT_SETTINGS = WeeklySettings()


# ---------------------------------------------------------
# Public API
# ---------------------------------------------------------

def generate_weekly_plan(
    subjects: List[Dict[str, Any]],
    weekly_hours: float,
    availability: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Generate a weekly plan using the unified schema.
    """
    subject_models = _parse_subjects(subjects)
    avail_model = _parse_availability(availability)
    settings = DEFAULT_SETTINGS

    requested_total = int(round(weekly_hours * 60))

    week_days = _build_week_days(avail_model)

    available_total = sum(d["available_minutes"] for d in week_days)
    total_minutes = min(requested_total, available_total)

    if total_minutes <= 0 or not subject_models:
        week_start = week_days[0]["date"].isoformat() if week_days else None
        return {"week_start": week_start, "days": []}

    weights = _compute_subject_weights(subject_models, settings)
    minutes_per_subject = _distribute_minutes_by_weight(weights, total_minutes)

    sessions = _expand_into_sessions(subject_models, minutes_per_subject, settings)

    raw_week_plan = _fill_week_blocks(week_days, subject_models, sessions, settings)

    fair_week_plan = adjust_for_fairness(raw_week_plan)

    validated_days = []
    for day in fair_week_plan["days"]:
        validated = validate_day_plan(day)
        validated_days.append(validated)

    return {
        "week_start": fair_week_plan.get("week_start"),
        "days": validated_days
    }


# ---------------------------------------------------------
# Parsing
# ---------------------------------------------------------

def _parse_subjects(subjects: List[Dict[str, Any]]) -> List[WeeklySubject]:
    out: List[WeeklySubject] = []
    for s in subjects:
        out.append(
            WeeklySubject(
                id=str(s["id"]),
                name=str(s["name"]),
                difficulty=int(s["difficulty"]),
                confidence=int(s["confidence"]),
                topics=s.get("topics", []) or []
            )
        )
    return out


def _parse_availability(data: Dict[str, Any]) -> WeeklyAvailability:
    mpw = data["minutes_per_weekday"]
    rest_dates = [_parse_date(d) for d in data.get("rest_dates", [])]
    start_date = _parse_date(data["start_date"])
    return WeeklyAvailability(
        minutes_per_weekday=mpw,
        rest_dates=rest_dates,
        start_date=start_date
    )


def _parse_date(value: str) -> date:
    return datetime.strptime(value, "%Y-%m-%d").date()


# ---------------------------------------------------------
# Weighting
# ---------------------------------------------------------

def _compute_subject_weights(subjects: List[WeeklySubject], settings: WeeklySettings) -> Dict[str, float]:
    weights: Dict[str, float] = {}
    for s in subjects:
        diff_score = s.difficulty / 5.0
        confidence_need = (6 - s.confidence) / 5.0
        weight = (
            settings.difficulty_weight * diff_score +
            settings.confidence_weight * confidence_need
        )
        weights[s.id] = max(weight, 0.0001)
    return weights


def _distribute_minutes_by_weight(weights: Dict[str, float], total_minutes: int) -> Dict[str, int]:
    total_weight = sum(weights.values())
    if total_weight <= 0:
        n = max(len(weights), 1)
        return {k: total_minutes // n for k in weights.keys()}

    out: Dict[str, int] = {}
    remainder = total_minutes

    for sid, w in weights.items():
        share = int(math.floor(total_minutes * (w / total_weight)))
        out[sid] = share
        remainder -= share

    if remainder > 0:
        sorted_ids = sorted(weights.keys(), key=lambda k: weights[k], reverse=True)
        idx = 0
        while remainder > 0:
            sid = sorted_ids[idx % len(sorted_ids)]
            out[sid] += 1
            remainder -= 1
            idx += 1

    return out


# ---------------------------------------------------------
# Session expansion
# ---------------------------------------------------------

def _expand_into_sessions(
    subjects: List[WeeklySubject],
    minutes_per_subject: Dict[str, int],
    settings: WeeklySettings
) -> Dict[str, List[int]]:

    sessions: Dict[str, List[int]] = {}

    for s in subjects:
        total = minutes_per_subject.get(s.id, 0)
        if total <= 0:
            sessions[s.id] = []
            continue

        if s.difficulty >= 4:
            pref_min, pref_max = settings.deep_work_min, settings.deep_work_max
        elif s.difficulty == 3:
            pref_min, pref_max = settings.medium_min, settings.medium_max
        else:
            pref_min, pref_max = settings.light_min, settings.light_max

        parts: List[int] = []
        remaining = total

        while remaining > pref_max:
            parts.append(pref_max)
            remaining -= pref_max

        if remaining >= pref_min:
            parts.append(remaining)
        else:
            if parts:
                parts[-1] += remaining
            else:
                parts.append(max(remaining, settings.min_light_session))

        if settings.max_sessions_per_subject_per_week:
            max_sessions = settings.max_sessions_per_subject_per_week
            while len(parts) > max_sessions:
                a = parts.pop()
                parts[-1] += a

        sessions[s.id] = parts

    return sessions


# ---------------------------------------------------------
# Week skeleton
# ---------------------------------------------------------

def _build_week_days(avail: WeeklyAvailability) -> List[Dict[str, Any]]:
    start = avail.start_date

    days: List[Dict[str, Any]] = []
    for i in range(7):
        d = start + timedelta(days=i)
        weekday = d.strftime("%A")

        minutes = avail.minutes_per_weekday.get(weekday, 0)
        if d in avail.rest_dates:
            minutes = 0

        days.append(
            {
                "date": d,
                "weekday": weekday,
                "available_minutes": minutes,
                "blocks": []
            }
        )
    return days


# ---------------------------------------------------------
# Block filling
# ---------------------------------------------------------

def _fill_week_blocks(
    week_days: List[Dict[str, Any]],
    subjects: List[WeeklySubject],
    sessions: Dict[str, List[int]],
    settings: WeeklySettings
) -> Dict[str, Any]:

    subject_map: Dict[str, WeeklySubject] = {s.id: s for s in subjects}

    subject_queue: List[Tuple[str, int]] = []
    for sid, sess_list in sessions.items():
        if sess_list:
            subject_queue.append((sid, 0))

    qptr = 0
    topic_state: Dict[str, Dict[str, Any]] = {}

    for day in week_days:
        available = day["available_minutes"]
        if settings.max_daily_minutes is not None:
            available = min(available, settings.max_daily_minutes)

        if available <= 0 or not subject_queue:
            day["blocks"] = []
            day["total_minutes"] = 0
            continue

        blocks: List[Dict[str, Any]] = []

        while available >= settings.min_light_session and subject_queue:
            block_capacity = available
            block_subjects: List[Dict[str, Any]] = []
            subjects_in_block = 0

            while (
                block_capacity >= settings.min_light_session
                and subjects_in_block < settings.max_subjects_per_block
                and subject_queue
            ):
                sid, idx = subject_queue[qptr % len(subject_queue)]
                qptr += 1

                sess_list = sessions.get(sid, [])
                if idx >= len(sess_list):
                    subject_queue = [(s, i) for (s, i) in subject_queue if s != sid]
                    if not subject_queue:
                        break
                    continue

                session_len = sess_list[idx]

                if session_len > block_capacity:
                    if block_capacity >= settings.light_min and session_len >= (settings.light_min + 10):
                        allocated = block_capacity
                        sessions[sid][idx] = session_len - allocated
                        session_len = allocated
                    else:
                        continue

                subj_spec = subject_map[sid]

                topic = pick_next_topic(
                    subject_id=sid,
                    topics=subj_spec.topics,
                    state=topic_state,
                    current_date=day["date"]
                )

                block_subjects.append(
                    {
                        "id": sid,
                        "name": subj_spec.name,
                        "minutes": session_len,
                        "topic": topic,
                        "difficulty": subj_spec.difficulty
                    }
                )

                block_capacity -= session_len
                subjects_in_block += 1

                subject_queue = [
                    (s, (i + 1 if s == sid else i)) for (s, i) in subject_queue
                ]

                if block_capacity < settings.min_light_session:
                    break

            if not block_subjects:
                break

            block_minutes = sum(s["minutes"] for s in block_subjects)
            block_raw = {
                "minutes": block_minutes,
                "subjects": block_subjects
            }

            # FIX: do NOT pass WeeklySettings into validate_block
            block_valid = validate_block(block_raw)
            blocks.append(block_valid)

            available -= block_valid.get("minutes", block_minutes)

            new_queue: List[Tuple[str, int]] = []
            for sid, idx in subject_queue:
                sess_list = sessions.get(sid, [])
                if idx < len(sess_list):
                    new_queue.append((sid, idx))
            subject_queue = new_queue

            if not subject_queue:
                break

        day["blocks"] = blocks
        day["total_minutes"] = sum(
            sum(s["minutes"] for s in block["subjects"])
            for block in blocks
        )

    week_start = week_days[0]["date"].isoformat() if week_days else None

    days_output = [
        {
            "date": d["date"].isoformat(),
            "weekday": d["weekday"],
            "total_minutes": d.get("total_minutes", 0),
            "blocks": d.get("blocks", []),
        }
        for d in week_days
    ]

    return {"week_start": week_start, "days": days_output}
