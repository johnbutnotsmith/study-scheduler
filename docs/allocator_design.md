# Allocator Design — Weekly & Exam Modes

This document describes the design of the allocators used to generate study plans.

---

# 1. Overview

There are two allocators:

1. **Exam Allocator** — optimized for exam dates  
2. **Weekly Allocator** — optimized for continuous learning  

Both allocators output the same structure:

- Blocks  
- Sessions  
- Activities  
- Goals  

---

# 2. Exam Allocator (Existing)

### Inputs:
- Exam dates  
- Topics  
- Difficulty  
- Familiarity  
- Daily availability  

### Logic:
- Prioritize exams by urgency  
- Allocate time proportionally to difficulty  
- Increase intensity near exam date  
- Rotate topics  
- Avoid starvation  

### Output:
A day‑by‑day plan until exam day.

---

# 3. Weekly Allocator (New)

### Inputs:
- Subjects  
- Weekly hours  
- Difficulty  
- Familiarity  
- Rest days  

### Logic:
1. **Subject caps**
   - Max 2 subjects per block  
   - Max 3 subjects per day  

2. **Deep‑work rules**
   - Hard subjects get 60–90 min chunks  
   - No mixing STEM + humanities in same block  

3. **Weekly fairness**
   - Each subject gets a minimum weekly allocation  

4. **Topic rotation**
   - Avoid repeating same topic 3 days in a row  

5. **Cognitive load model**
   - Limit domain switching  
   - Place hard subjects earlier  

### Output:
A 7‑day weekly rotation.

---

# 4. Cognitive Load Integration

The allocator calls:

```
cognitive_load.evaluate(day, block, subjects)
```

This ensures:

- no overload  
- no fragmentation  
- realistic study flow  

---

# 5. Extensibility

Allocators are modular:

- weekly_allocator.py  
- exam_allocator.py  
- cognitive_load.py  
- fairness.py  

They can evolve independently.
