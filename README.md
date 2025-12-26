Study Scheduler — Phase 3 (Productization Build)
This repository contains the production‑ready architecture for the Study Scheduler SaaS.
Phase 3 focuses on transforming the validated prototype into a scalable, maintainable, and extensible product.
The system is divided into four major components:
- Backend — plan generation engine, allocators, API, PDF export
- Frontend — onboarding, dashboard, plan viewer
- AI Layer — optional intelligence modules (topic extraction, explanations, adjustments)
- Documentation — architecture, API contracts, allocator design, roadmap

📁 Folder Structure Overview
phase_3_product/
│
├── backend/      # Core logic, API, database, allocators, PDF generation
├── frontend/     # User interface (Next.js or React)
├── ai/           # Optional AI modules (LLMs, prompts, adjusters)
└── docs/         # Architecture, API contracts, allocator design, roadmap



🧠 Backend
The backend contains all the logic required to generate study plans, export PDFs, and serve API requests.
Structure:
- api/ — API endpoints (generate plan, weekly plan, PDF, auth)
- core/
- allocator/ — weekly allocator, exam allocator, cognitive load model
- models/ — subjects, blocks, plans, users
- utils/ — PDF utilities, time utilities, validation, logging
- engine/ — core study engine logic
- database/ — schema, migrations, DB connection
- config/ — settings and environment variables
- tests/ — unit tests for allocators, API, and PDF generation

🎨 Frontend
The frontend provides the user interface for onboarding, plan preview, and account management.
Structure:
- pages/ — onboarding, dashboard, pricing, plan viewer
- components/ — reusable UI components
- styles/ — global and layout CSS
- public/ — images, icons, logos

🤖 AI Layer (Optional)
This folder contains optional AI modules that enhance the product:
- topic_extractor.py — converts user text into structured topics
- plan_explainer.py — explains why the plan looks the way it does
- adjuster.py — adapts plans based on user feedback
- prompts/ — prompt templates for LLMs
These features can be added after launch.

📚 Documentation
The docs folder contains all internal documentation:
- architecture.md — system overview
- api_contract.md — API endpoints and request/response formats
- allocator_design.md — weekly/exam allocator logic
- cognitive_load_model.md — deep work rules, subject caps, domain switching
- roadmap.md — future features and priorities

🚀 Getting Started
- Install backend dependencies
- Run the backend server
- Run the frontend
- Generate a plan through the onboarding flow
Detailed setup instructions will be added as the implementation progresses.

📌 Status
Phase 3 is currently in active development.
The goal is to deliver:
- Weekly mode
- Exam mode
- PDF export
- Onboarding
- Dashboard
- Stripe payments
within 7–12 days of focused work.
