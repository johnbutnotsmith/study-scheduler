from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime, timedelta
from typing import List, Dict, Any, Optional, Tuple
import math

from .cognitive_load import validate_day_plan, validate_block
from .fairness import adjust_for_fairness
from ..engine.topic_rotation import pick_next_topic


# ---------- Data models ----------

@dataclass
class SubjectSpec:
    id: str
    name: str
    difficulty: int
    familiarity: int
    topics: List[Dict[str, Any]]


@dataclass
class WeeklyAvailability:
    minutes_per_weekday: Dict[str, int]
    rest_days: List[str]
    start_date: Optional[date] = None


@dataclass
class WeeklySettings:
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
    unfamiliarity_weight: float = 0.4

    max_daily_minutes: Optional[int] = None


# ---------- Public API ----------

def generate_weekly_plan(
    subjects: List[Dict[str, Any]],
    weekly_hours: float,
    availability: Dict[str, Any],
    settings: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:

    subject_models = _parse_subjects(subjects)
    avail_model = _parse_availability(availability)
    settings_model = _parse_settings(settings)

    requested_total = int(round(weekly_hours * 60))
    week_days = _build_week_days(avail_model)
    available_total = sum(d["available_minutes"] for d in week_days)

    total_minutes = min(requested_total, available_total)
    if total_minutes <= 0 or not subject_models:
        week_start = week_days[0]["date"].isoformat() if week_days else None
        return {"week_start": week_start, "days": []}

    weights = _compute_subject_weights(subject_models, settings_model)
    minutes_per_subject = _distribute_minutes_by_weight(weights, total_minutes)

    sessions = _expand_into_sessions(subject_models, minutes_per_subject, settings_model)

    raw_week_plan = _fill_week_blocks(week_days, subject_models, sessions, settings_model)

    fair_week_plan = adjust_for_fairness(raw_week_plan)

    validated_days = []
    for day in fair_week_plan["days"]:
        validated = validate_day_plan(day)
        blocks = validated.get("blocks", [])
        validated["total_minutes"] = sum(b.get("minutes", 0) for b in blocks)
        validated_days.append(validated)

    return {
        "week_start": fair_week_plan.get("week_start"),
        "days": validated_days
    }


# ---------- Parsing helpers ----------

def _parse_subjects(subjects: List[Dict[str, Any]]) -> List[SubjectSpec]:
    out: List[SubjectSpec] = []
    for s in subjects:
        out.append(
            SubjectSpec(
                id=str(s["id"]),
                name=str(s["name"]),
                difficulty=int(s.get("difficulty", 3)),
                familiarity=int(s.get("familiarity", 3)),
                topics=s.get("topics", []) or []
            )
        )
    return out


def _parse_availability(data: Dict[str, Any]) -> WeeklyAvailability:
    mpw = data.get("minutes_per_weekday", {})
    rest = data.get("rest_days", [])
    start_date = None
    if data.get("start_date"):
        start_date = datetime.strptime(data["start_date"], "%Y-%m-%d").date()
    return WeeklyAvailability(minutes_per_weekday=mpw, rest_days=rest, start_date=start_date)


def _parse_settings(data: Optional[Dict[str, Any]]) -> WeeklySettings:
    if not data:
        return WeeklySettings()
    s = WeeklySettings()
    for k, v in data.items():
        if hasattr(s, k):
            setattr(s, k, v)
    return s


# ---------- Weighting and session expansion ----------

def _compute_subject_weights(subjects: List[SubjectSpec], settings: WeeklySettings) -> Dict[str, float]:
    weights: Dict[str, float] = {}
    for s in subjects:
        diff_score = s.difficulty / 5.0
        unfam_score = (6 - s.familiarity) / 5.0
        weight = settings.difficulty_weight * diff_score + settings.unfamiliarity_weight * unfam_score
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
        while remainder > 0 and sorted_ids:
            sid = sorted_ids[idx % len(sorted_ids)]
            out[sid] += 1
            remainder -= 1
            idx += 1

    return out


def _expand_into_sessions(
    subjects: List[SubjectSpec],
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


# ---------- Week skeleton ----------

def _build_week_days(avail: WeeklyAvailability) -> List[Dict[str, Any]]:
    if avail.start_date:
        start = avail.start_date
    else:
        today = date.today()
        start = today + timedelta(days=(7 - today.weekday())) if today.weekday() != 0 else today

    days: List[Dict[str, Any]] = []
    for i in range(7):
        d = start + timedelta(days=i)
        weekday = d.strftime("%A")
        if weekday in avail.rest_days:
            minutes = 0
        else:
            minutes = avail.minutes_per_weekday.get(weekday, 0)
        days.append(
            {
                "date": d,
                "weekday": weekday,
                "available_minutes": minutes,
                "blocks": []
            }
        )
    return days


# ---------- Time assignment helper ----------

def _assign_times_to_blocks(blocks, start_time_str="09:00"):
    if not blocks:
        return blocks

    hour, minute = map(int, start_time_str.split(":"))
    current = timedelta(hours=hour, minutes=minute)

    out = []
    for b in blocks:
        start = current
        end = start + timedelta(minutes=b["minutes"])

        b["start"] = f"{start.seconds//3600:02d}:{(start.seconds//60)%60:02d}"
        b["end"] = f"{end.seconds//3600:02d}:{(end.seconds//60)%60:02d}"

        current = end
        out.append(b)

    return out


# ---------- Block filling (with infinite-loop fix + time layout) ----------

def _fill_week_blocks(
    week_days: List[Dict[str, Any]],
    subjects: List[SubjectSpec],
    sessions: Dict[str, List[int]],
    settings: WeeklySettings
) -> Dict[str, Any]:

    subject_map: Dict[str, SubjectSpec] = {s.id: s for s in subjects}

    subject_queue: List[Tuple[str, int]] = []
    for sid, sess_list in sessions.items():
        if sess_list:
            subject_queue.append((sid, 0))

    qptr = 0
    topic_state: Dict[str, int] = {}

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
            block_type = "deep" if available >= settings.deep_work_min else "reinforce"
            block_capacity = available
            block_subjects: List[Dict[str, Any]] = []
            subjects_in_block = 0

            # FIX: removed local_seen to avoid infinite loop
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

                subj_spec = subject_map.get(sid)
                if not subj_spec:
                    continue

                topic = pick_next_topic(subj_spec.name, subj_spec.topics, topic_state)

                block_subjects.append(
                    {
                        "id": sid,
                        "name": subj_spec.name,
                        "minutes": session_len,
                        "topic": topic
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
                "type": block_type,
                "minutes": block_minutes,
                "subjects": block_subjects
            }

            block_valid = validate_block(block_raw, settings)
            block_valid["start"] = None
            block_valid["end"] = None

            blocks.append(block_valid)
            available -= block_valid.get("minutes", block_minutes)

            if available < settings.min_light_session:
                break

            new_queue: List[Tuple[str, int]] = []
            for sid, idx in subject_queue:
                sess_list = sessions.get(sid, [])
                if idx < len(sess_list):
                    new_queue.append((sid, idx))
            subject_queue = new_queue
            if not subject_queue:
                break

        # Assign start/end times
        blocks_with_times = _assign_times_to_blocks(blocks, start_time_str="09:00")

        day["blocks"] = blocks_with_times
        day["total_minutes"] = sum(b.get("minutes", 0) for b in blocks_with_times)

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
