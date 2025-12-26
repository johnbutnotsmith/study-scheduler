# backend/core/allocator/fairness.py
from __future__ import annotations
from typing import Dict, Any, List
from collections import defaultdict

def adjust_for_fairness(week_plan: Dict[str, Any], min_sessions_per_subject: int = 1) -> Dict[str, Any]:
    """
    Ensure each subject appears at least min_sessions_per_subject times in the week.
    If a subject is underrepresented, try to move small fragments from overrepresented subjects.
    This is a best-effort, fast adjustment that preserves total minutes.
    """
    # Count appearances
    counts = defaultdict(int)
    subject_minutes = defaultdict(int)
    for day in week_plan.get("days", []):
        for block in day.get("blocks", []):
            for s in block.get("subjects", []):
                sid = s.get("id")
                counts[sid] += 1
                subject_minutes[sid] += s.get("minutes", 0)

    # Identify underrepresented subjects
    under = [sid for sid, c in counts.items() if c < min_sessions_per_subject]
    if not under:
        return week_plan

    # Identify donors (subjects with > min_sessions)
    donors = [sid for sid, c in counts.items() if c > min_sessions_per_subject]
    if not donors:
        return week_plan

    # For each under subject, try to steal small minutes from donors and insert a small session on a low-load day
    for target in under:
        needed = 1 - counts.get(target, 0)
        # find a day with smallest total_minutes
        days_sorted = sorted(week_plan.get("days", []), key=lambda d: d.get("total_minutes", 0))
        for d in days_sorted:
            if needed <= 0:
                break
            # find a donor subject in some block with a small fragment to split
            found = False
            for block in d.get("blocks", []):
                for donor in donors:
                    for subj in block.get("subjects", []):
                        if subj.get("id") == donor and subj.get("minutes", 0) >= 20:
                            # split 20 minutes off
                            split = 20
                            subj["minutes"] -= split
                            # insert new subject fragment for target
                            block["subjects"].append({"id": target, "minutes": split, "topic": {"name": "Fairness insert"}})
                            counts[target] += 1
                            subject_minutes[target] += split
                            subject_minutes[donor] -= split
                            needed -= 1
                            found = True
                            break
                    if found:
                        break
                if found:
                    break
    # Recompute totals
    for d in week_plan.get("days", []):
        d["total_minutes"] = sum(sum(s["minutes"] for s in b.get("subjects", [])) for b in d.get("blocks", []))
    return week_plan