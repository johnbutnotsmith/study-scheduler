# backend/core/allocator/cognitive_load.py
from __future__ import annotations
from typing import Dict, Any
from dataclasses import dataclass


@dataclass
class CLSettings:
    """
    Cognitive load constraints for realistic study scheduling.
    These values are internal constants (not user-facing).
    """
    max_subjects_per_block: int = 2
    max_subjects_per_day: int = 3
    hard_subject_threshold: int = 4      # difficulty >= this is considered "hard"
    max_hard_subjects_per_day: int = 2
    min_light_session: int = 20          # minimum viable session length


# ---------------------------------------------------------
# BLOCK VALIDATION
# ---------------------------------------------------------

def validate_block(block: Dict[str, Any], settings: CLSettings | None = None) -> Dict[str, Any]:
    """
    Ensures each block respects:
      - max subjects per block
      - no tiny fragments (< min_light_session)

    Operates on the unified block structure:
        block = {
            "minutes": int,
            "subjects": [
                {"id": str, "name": str, "minutes": int, "topic": {...}, "difficulty": int}
            ]
        }
    """
    if settings is None:
        settings = CLSettings()

    subjects = block.get("subjects", [])

    # 1. Enforce max subjects per block
    if len(subjects) > settings.max_subjects_per_block:
        # Sort by minutes ascending, merge smallest into the largest
        subjects_sorted = sorted(subjects, key=lambda s: s["minutes"])
        while len(subjects_sorted) > settings.max_subjects_per_block:
            small = subjects_sorted.pop(0)
            subjects_sorted[-1]["minutes"] += small["minutes"]
        block["subjects"] = subjects_sorted

    # 2. Remove tiny fragments (< min_light_session)
    subjects = block.get("subjects", [])
    if subjects:
        tiny = [s for s in subjects if s["minutes"] < settings.min_light_session]
        if tiny:
            largest = max(subjects, key=lambda s: s["minutes"])
            for t in tiny:
                if t is largest:
                    continue
                largest["minutes"] += t["minutes"]
                subjects.remove(t)
            block["subjects"] = subjects

    # 3. Recompute block total minutes
    block["minutes"] = sum(s["minutes"] for s in block.get("subjects", []))

    return block


# ---------------------------------------------------------
# DAY VALIDATION
# ---------------------------------------------------------

def validate_day_plan(day: Dict[str, Any], settings: CLSettings | None = None) -> Dict[str, Any]:
    """
    Ensures each day respects:
      - max subjects per day
      - max hard subjects per day

    Operates on unified day structure:
        day = {
            "date": "...",
            "blocks": [...],
            "total_minutes": int
        }
    """
    if settings is None:
        settings = CLSettings()

    blocks = day.get("blocks", [])

    # Collect subject IDs and difficulty
    subj_ids = []
    hard_count = 0

    for block in blocks:
        for s in block.get("subjects", []):
            subj_ids.append(s.get("id"))
            if s.get("difficulty", 0) >= settings.hard_subject_threshold:
                hard_count += 1

    # 1. Enforce max subjects per day
    unique_subjs = list(dict.fromkeys([sid for sid in subj_ids if sid is not None]))
    if len(unique_subjs) > settings.max_subjects_per_day:
        keep = set(unique_subjs[:settings.max_subjects_per_day])

        for block in blocks:
            kept = []
            for s in block.get("subjects", []):
                if s["id"] in keep:
                    kept.append(s)
                else:
                    # merge minutes into first kept subject if exists
                    if kept:
                        kept[0]["minutes"] += s["minutes"]
            block["subjects"] = kept
            block["minutes"] = sum(s["minutes"] for s in kept)

    # 2. Enforce hard subject cap (simple v1 rule)
    if hard_count > settings.max_hard_subjects_per_day:
        # Reduce minutes of hard subjects by 10% (best-effort)
        for block in blocks:
            for s in block.get("subjects", []):
                if s.get("difficulty", 0) >= settings.hard_subject_threshold:
                    s["minutes"] = int(s["minutes"] * 0.9)

    # 3. Recompute block and day totals to keep everything consistent
    for block in blocks:
        block["minutes"] = sum(s["minutes"] for s in block.get("subjects", []))

    day["total_minutes"] = sum(block["minutes"] for block in blocks)

    return day


# ---------------------------------------------------------
# WEEK VALIDATION (minimal v1)
# ---------------------------------------------------------

def validate_week_plan(week: Dict[str, Any], settings: CLSettings | None = None) -> Dict[str, Any]:
    """
    Minimal weekly validation.
    Ensures no subject appears in unrealistic frequency (e.g., 6–7 days in a row).
    """
    if settings is None:
        settings = CLSettings()

    # Simple rule: no subject appears more than 5 days in a row
    # (placeholder for future expansion)
    return week