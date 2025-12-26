# backend/core/engine/topic_rotation.py
from typing import List, Dict, Any

def pick_next_topic(subject_id: str, topics: List[Dict[str, Any]], state: Dict[str, int]) -> Dict[str, Any]:
    """
    Round-robin topic picker with simple state dict.
    state is mutated in-place: state[subject_id] = next_index
    """
    if not topics:
        return {"name": "General review", "id": None}
    idx = state.get(subject_id, 0) % len(topics)
    topic = topics[idx]
    state[subject_id] = (idx + 1) % len(topics)
    return topic