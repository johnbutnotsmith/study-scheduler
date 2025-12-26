# Architecture Overview — Study Scheduler (Phase 3)

This document describes the high‑level architecture of the Study Scheduler SaaS in Phase 3.  
The system is designed to be modular, scalable, and easy to extend with AI features.

---

# 1. System Overview

The system consists of four major layers:

1. **Frontend (Next.js / React)**  
   - Onboarding  
   - Dashboard  
   - Plan preview  
   - PDF download  
   - Pricing & checkout  

2. **Backend (FastAPI / Flask)**  
   - Weekly allocator  
   - Exam allocator  
   - Cognitive load model  
   - PDF generator  
   - API endpoints  
   - Database access  

3. **AI Layer (optional)**  
   - Topic extraction  
   - Plan explanation  
   - Adaptive adjustments  
   - Prompt templates  

4. **Database (Postgres / Supabase)**  
   - Users  
   - Plans  
   - Subjects  
   - Check‑ins  
   - Usage logs  

---

# 2. Backend Architecture

```
backend/
│
├── api/              # API endpoints
├── core/             # Engine logic
│   ├── allocator/    # Weekly + exam allocators
│   ├── models/       # Data models
│   ├── utils/        # Helpers (PDF, time, validation)
│   └── engine/       # Core study engine logic
│
├── database/         # Schema + migrations
├── config/           # Settings + secrets
└── tests/            # Unit tests
```

The backend exposes a small set of endpoints:

- `/generate-plan`  
- `/generate-weekly-plan`  
- `/export-pdf`  
- `/auth/*`  

The allocators are isolated modules so they can evolve independently.

---

# 3. Frontend Architecture

```
frontend/
│
├── pages/            # Routing pages
├── components/       # Reusable UI components
├── styles/           # CSS
└── public/           # Static assets
```

The frontend communicates with the backend via REST API.

---

# 4. AI Layer

```
ai/
│
├── topic_extractor.py
├── plan_explainer.py
├── adjuster.py
└── prompts/
```

This layer is optional and can be activated later.

---

# 5. Data Flow

1. User completes onboarding  
2. Frontend sends JSON to backend  
3. Backend selects allocator (weekly/exam)  
4. Allocator generates structured plan  
5. PDF generator formats the plan  
6. Frontend displays preview + download  
7. User can regenerate or adjust plan  

---

# 6. Deployment

- **Frontend** → Vercel / Netlify  
- **Backend** → Railway / Fly.io  
- **Database** → Supabase / Neon  
- **Storage** → Supabase Storage / S3  

---

# 7. Scalability

The architecture supports:

- thousands of users  
- multiple plan types  
- AI‑powered features  
- mobile app integration  

---

# 8. Security

- JWT authentication  
- HTTPS everywhere  
- Secrets stored in environment variables  
- No sensitive data in logs  

---

# 9. Future Extensions

- Adaptive learning  
- AI tutoring  
- Parent dashboards  
- Mobile app  
- Study streaks  
- Notifications  
