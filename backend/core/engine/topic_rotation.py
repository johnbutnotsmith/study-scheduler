# backend/core/engine/topic_rotation.py
from __future__ import annotations
from typing import List, Dict, Any
import datetime


def pick_next_topic(
    subject_id: str,
    topics: List[Dict[str, Any]],
    state: Dict[str, Dict[str, Any]],
    current_date: datetime.date
) -> Dict[str, Any]:
    """
    Minimal spaced-repetition topic selector.
    Works with the unified topic schema:
        {
            "id": str,
            "name": str,
            "priority": int,
            "familiarity": int
        }

    State structure (per subject):
        state = {
            subject_id: {
                topic_id: {
                    "last_seen": date | None,
                    "times_seen": int
                }
            }
        }

    Returns the best topic based on:
        - priority (importance)
        - familiarity (memory strength)
        - gap since last_seen (spacing)
        - repetition penalty (avoid overusing same topic)
    """

    if not topics:
        return {"id": None, "name": "General review"}

    # Initialize state for this subject if missing
    if subject_id not in state:
        state[subject_id] = {}

    subject_state = state[subject_id]

    best_topic = None
    best_score = -1

    for t in topics:
        tid = t["id"]
        priority = int(t.get("priority", 3))
        familiarity = int(t.get("familiarity", 3))

        # Initialize topic state if missing
        if tid not in subject_state:
            subject_state[tid] = {"last_seen": None, "times_seen": 0}

        ts = subject_state[tid]
        last_seen = ts["last_seen"]
        times_seen = ts["times_seen"]

        # --- Compute gap days ---
        if last_seen is None:
            gap_days = 7
        else:
            gap_days = max((current_date - last_seen).days, 1)

        # --- Compute spaced repetition score ---
        # Higher priority → more important
        # Lower familiarity → needs more review
        # Larger gap_days → spaced repetition
        # More times_seen → repetition penalty
        base_importance = priority * (6 - familiarity)
        gap_factor = min(gap_days, 7)
        repetition_penalty = 1.0 / (1 + 0.1 * times_seen)

        score = base_importance * gap_factor * repetition_penalty

        if score > best_score:
            best_score = score
            best_topic = t

    # Update state for chosen topic
    chosen_id = best_topic["id"]
    subject_state[chosen_id]["last_seen"] = current_date
    subject_state[chosen_id]["times_seen"] += 1

    return best_topic