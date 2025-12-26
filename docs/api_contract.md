# API Contract — Study Scheduler (Phase 3)

This document defines the API endpoints, request formats, and response formats for the Study Scheduler backend.

---

# 1. Authentication

## POST /auth/register
Registers a new user.

### Request
```json
{
  "email": "user@example.com",
  "password": "secret123"
}
```

### Response
```json
{
  "user_id": "uuid",
  "token": "jwt_token"
}
```

---

## POST /auth/login
Logs in an existing user.

### Request
```json
{
  "email": "user@example.com",
  "password": "secret123"
}
```

### Response
```json
{
  "user_id": "uuid",
  "token": "jwt_token"
}
```

---

# 2. Plan Generation

## POST /generate-plan
Generates an **exam‑based** study plan.

### Request
```json
{
  "subjects": [...],
  "exams": [...],
  "availability": {...}
}
```

### Response
```json
{
  "plan_id": "uuid",
  "plan": {...}
}
```

---

## POST /generate-weekly-plan
Generates a **weekly rotation** study plan.

### Request
```json
{
  "subjects": [...],
  "weekly_hours": 12,
  "rest_days": ["Sunday"]
}
```

### Response
```json
{
  "plan_id": "uuid",
  "plan": {...}
}
```

---

# 3. PDF Export

## POST /export-pdf
Converts a plan into a PDF.

### Request
```json
{
  "plan_id": "uuid"
}
```

### Response
```json
{
  "pdf_url": "https://..."
}
```

---

# 4. Check‑ins

## POST /checkin
Logs daily progress.

### Request
```json
{
  "plan_id": "uuid",
  "completed": true,
  "notes": "Hard day"
}
```

### Response
```json
{ "status": "ok" }
```

---

# 5. Errors

All errors follow this format:

```json
{
  "error": "Invalid input",
  "details": "Subject difficulty missing"
}
```
