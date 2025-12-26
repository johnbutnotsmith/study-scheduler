# Cognitive Load Model — Study Scheduler

This document defines the cognitive load rules used to generate realistic, human‑credible study plans.

---

# 1. Purpose

The cognitive load model prevents:

- too many subjects per day  
- chaotic switching  
- unrealistic micro‑sessions  
- mixing incompatible domains  
- cognitive overload  

---

# 2. Core Rules

## Rule 1 — Max Subjects Per Block
- Hard cap: **2 subjects per block**

## Rule 2 — Max Subjects Per Day
- Hard cap: **3 subjects per day**

---

# 3. Deep‑Work Rules

## Hard subjects (difficulty 4–5)
- 60–90 minute chunks  
- No splitting into micro‑sessions  

## Medium subjects (difficulty 2–3)
- 40–60 minute sessions  

## Light subjects (difficulty 1)
- 20–40 minute sessions  

---

# 4. Domain Switching Rules

## Allowed:
- STEM → STEM  
- Humanities → Humanities  

## Discouraged:
- STEM → Humanities in same block  

## Forbidden:
- 3+ domain switches in a single day  

---

# 5. Fatigue Rules

- Hard subjects earlier in the day  
- Light subjects in afternoon blocks  
- No more than 2 hard subjects per day  

---

# 6. Weekly Rules

- Each subject must appear at least once  
- Hard subjects appear 3–4×  
- Light subjects appear 2–3×  

---

# 7. Implementation

The allocator calls:

```
cognitive_load.validate_block(block)
cognitive_load.validate_day(day)
cognitive_load.validate_week(week)
```

If a rule is violated, the allocator adjusts:

- subject order  
- session length  
- block composition  

---

# 8. Extensibility

Future additions:

- ADHD mode  
- burnout detection  
- adaptive difficulty  
- spaced repetition model  
