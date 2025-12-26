# tests/test_cognitive_load.py
from backend.core.allocator.cognitive_load import validate_block, validate_day_plan, CLSettings

def test_validate_block_trims_and_merges():
    settings = CLSettings()
    block = {
        "type": "deep",
        "minutes": 120,
        "subjects": [
            {"id": "a", "minutes": 30},
            {"id": "b", "minutes": 10},  # tiny fragment should be merged
            {"id": "c", "minutes": 30},
            {"id": "d", "minutes": 20},  # may be trimmed if > max subjects per block
        ]
    }
    out = validate_block(block, settings)
    # After validation, no subject should have minutes < min_light_session
    for s in out.get("subjects", []):
        assert s["minutes"] >= settings.min_light_session
    # And number of subjects should be <= max_subjects_per_block
    assert len(out.get("subjects", [])) <= settings.max_subjects_per_block

def test_validate_day_enforces_subject_cap():
    settings = CLSettings()
    day = {
        "date": "2025-01-01",
        "blocks": [
            {"subjects": [{"id": "s1", "minutes": 60}, {"id": "s2", "minutes": 30}]},
            {"subjects": [{"id": "s3", "minutes": 45}, {"id": "s4", "minutes": 30}]},
        ]
    }
    out = validate_day_plan(day, settings)
    # unique subjects should be <= max_subjects_per_day
    subj_ids = []
    for b in out.get("blocks", []):
        for s in b.get("subjects", []):
            subj_ids.append(s.get("id"))
    unique = set(subj_ids)
    assert len(unique) <= settings.max_subjects_per_day