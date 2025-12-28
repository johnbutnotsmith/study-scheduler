from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .generate_weekly_plan import router as weekly_router
from .generate_exam_plan import router as exam_router

app = FastAPI(title="Study Scheduler API")

# --- CORS FIX (required for Vite frontend) ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # allow Vercel, localhost, anything
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- ROUTES ---
app.include_router(weekly_router)
app.include_router(exam_router)