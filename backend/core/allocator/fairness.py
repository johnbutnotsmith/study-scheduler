# backend/core/allocator/fairness.py
from __future__ import annotations
from typing import Dict, Any, List
from collections import defaultdict


def adjust_for_fairness(week_plan: Dict[str, Any], min_sessions_per_subject: int = 1) -> Dict[str, Any]:
    """
    Ensures each subject appears at least `min_sessions_per_subject` times
    across the entire week.

    Works with the unified plan structure:
        week_plan = {
            "days": [
                {
                    "date": "...",
                    "blocks": [
                        {
                            "minutes": int,
                            "subjects": [
                                {"id": str, "name": str, "minutes": int, "topic": {...}, "difficulty": int}
                            ]
                        }
                    ],
                    "total_minutes": int
                }
            ]
        }

    Strategy:
      1. Count how many times each subject appears.
      2. Identify underrepresented subjects.
      3. Identify donors (subjects with extra appearances).
      4. Move 20-minute fragments from donors to underrepresented subjects.
      5. Recompute totals.
    """

    days = week_plan.get("days", [])
    if not days:
        return week_plan

    # ---------------------------------------------------------
    # 1. Count subject appearances and minutes
    # ---------------------------------------------------------
    counts = defaultdict(int)
    subject_minutes = defaultdict(int)

    for day in days:
        for block in day.get("blocks", []):
            for s in block.get("subjects", []):
                sid = s["id"]
                counts[sid] += 1
                subject_minutes[sid] += s["minutes"]

    # ---------------------------------------------------------
    # 2. Identify underrepresented subjects
    # ---------------------------------------------------------
    under = [sid for sid, c in counts.items() if c < min_sessions_per_subject]
    if not under:
        return week_plan

    # ---------------------------------------------------------
    # 3. Identify donors (subjects with > min_sessions)
    # ---------------------------------------------------------
    donors = [sid for sid, c in counts.items() if c > min_sessions_per_subject]
    if not donors:
        return week_plan

    # ---------------------------------------------------------
    # 4. For each underrepresented subject, try to steal 20 minutes
    # ---------------------------------------------------------
    for target in under:
        needed = min_sessions_per_subject - counts.get(target, 0)

        # Sort days by total load (lightest first)
        days_sorted = sorted(days, key=lambda d: d.get("total_minutes", 0))

        for day in days_sorted:
            if needed <= 0:
                break

            for block in day.get("blocks", []):
                # Try to find a donor subject with >= 20 minutes
                for subj in block.get("subjects", []):
                    donor_id = subj["id"]
                    if donor_id in donors and subj["minutes"] >= 20:
                        # Split 20 minutes
                        split = 20
                        subj["minutes"] -= split

                        # Insert new subject fragment
                        block["subjects"].append({
                            "id": target,
                            "name": f"Subject {target}",
                            "minutes": split,
                            "topic": {"id": None, "name": "Fairness insert"},
                            "difficulty": 1
                        })

                        counts[target] += 1
                        subject_minutes[target] += split
                        subject_minutes[donor_id] -= split
                        needed -= 1
                        break

                if needed <= 0:
                    break

    # ---------------------------------------------------------
    # 5. Recompute total_minutes for each day
    # ---------------------------------------------------------
    for day in days:
        day["total_minutes"] = sum(
            sum(s["minutes"] for s in block.get("subjects", []))
            for block in day.get("blocks", [])
        )

    return week_plan