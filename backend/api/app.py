from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .generate_weekly_plan import router as weekly_router
from .generate_exam_plan import router as exam_router

app = FastAPI(title="Study Scheduler API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://study-scheduler-nine.vercel.app",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(weekly_router)
app.include_router(exam_router)