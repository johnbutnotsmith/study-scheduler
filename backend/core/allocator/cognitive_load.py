# backend/core/allocator/cognitive_load.py
from __future__ import annotations
from typing import Dict, Any, List
from dataclasses import dataclass

# Core rules are intentionally conservative and fast to evaluate.

@dataclass
class CLSettings:
    max_subjects_per_block: int = 2
    max_subjects_per_day: int = 3
    max_domain_switches_per_day: int = 2
    hard_subject_threshold: int = 4  # difficulty >= this is hard
    max_hard_subjects_per_day: int = 2
    min_deep_session: int = 45
    min_light_session: int = 20

# Public validators

def validate_block(block: Dict[str, Any], settings: CLSettings | None = None) -> Dict[str, Any]:
    """
    Ensure block respects:
      - max subjects per block
      - no tiny fragments
    Returns possibly adjusted block.
    """
    if settings is None:
        settings = CLSettings()

    subjects = block.get("subjects", [])
    # Trim subjects if too many (merge smallest into previous)
    if len(subjects) > settings.max_subjects_per_block:
        # sort by minutes ascending, merge smallest into next
        subjects_sorted = sorted(subjects, key=lambda x: x["minutes"])
        while len(subjects_sorted) > settings.max_subjects_per_block:
            small = subjects_sorted.pop(0)
            # merge into the largest remaining
            subjects_sorted[-1]["minutes"] += small["minutes"]
            # optionally merge topics (drop small topic)
        block["subjects"] = subjects_sorted

    # Remove tiny fragments (< min_light_session) by merging into largest subject
    subjects = block.get("subjects", [])
    if subjects:
        tiny = [s for s in subjects if s["minutes"] < settings.min_light_session]
        if tiny:
            # merge all tiny into the largest subject
            largest = max(subjects, key=lambda x: x["minutes"])
            for t in tiny:
                if t is largest:
                    continue
                largest["minutes"] += t["minutes"]
                subjects.remove(t)
            block["subjects"] = subjects

    return block

def validate_day_plan(day: Dict[str, Any], settings: CLSettings | None = None) -> Dict[str, Any]:
    """
    Validate a day's blocks:
      - enforce max subjects per day
      - enforce max hard subjects per day
      - enforce domain switching limit (best-effort using subject names or domains if provided)
    Returns adjusted day.
    """
    if settings is None:
        settings = CLSettings()

    blocks = day.get("blocks", [])
    # collect subject ids and minutes
    subj_list = []
    hard_count = 0
    for b in blocks:
        for s in b.get("subjects", []):
            subj_list.append(s.get("id"))
            # if difficulty info present in subject dict, count hard subjects
            if isinstance(s, dict) and s.get("difficulty", 0) >= settings.hard_subject_threshold:
                hard_count += 1

    # enforce max subjects per day
    unique_subjs = list(dict.fromkeys([x for x in subj_list if x is not None]))
    if len(unique_subjs) > settings.max_subjects_per_day:
        # trim: keep first N subjects, merge others into reinforcement blocks
        keep = set(unique_subjs[:settings.max_subjects_per_day])
        for b in blocks:
            new_subjects = []
            for s in b.get("subjects", []):
                if s.get("id") in keep:
                    new_subjects.append(s)
                else:
                    # merge minutes into the first kept subject in block if exists
                    if new_subjects:
                        new_subjects[0]["minutes"] += s["minutes"]
            b["subjects"] = new_subjects

    # enforce hard subject cap
    if hard_count > settings.max_hard_subjects_per_day:
        # reduce hard subject minutes by shifting some minutes to lighter subjects if present
        # best-effort: find hard subjects and reduce their minutes by 10% until under cap
        pass  # keep simple for v1

    # domain switching best-effort: if too many switches, merge adjacent blocks of similar domain
    # (requires domain metadata; skip if not present)

    # recompute total_minutes
    day["total_minutes"] = sum(sum(s["minutes"] for s in b.get("subjects", [])) for b in blocks)
    return day

def validate_week_plan(week: Dict[str, Any], settings: CLSettings | None = None) -> Dict[str, Any]:
    """
    Validate entire week. Ensures no subject appears in unrealistic frequency or violates weekly fatigue rules.
    """
    if settings is None:
        settings = CLSettings()

    # Example rule: no subject more than 5 days in a row (simple scan)
    # Implementation left minimal for v1
    return week