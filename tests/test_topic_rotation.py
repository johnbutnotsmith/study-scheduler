# tests/test_topic_rotation.py
from backend.core.engine.topic_rotation import pick_next_topic

def test_pick_next_topic_round_robin():
    topics = [{"id": "t1", "name": "A"}, {"id": "t2", "name": "B"}, {"id": "t3", "name": "C"}]
    state = {}
    picks = [pick_next_topic("s1", topics, state)["id"] for _ in range(5)]
    # Expect cycling: t1, t2, t3, t1, t2
    assert picks[0] == "t1"
    assert picks[1] == "t2"
    assert picks[2] == "t3"
    assert picks[3] == "t1"
    assert picks[4] == "t2"