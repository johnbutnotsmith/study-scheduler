from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.generate_weekly_plan import router as weekly_router
from api.generate_exam_plan import router as exam_router

app = FastAPI()

# CORS (allow all for MVP)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(weekly_router)
app.include_router(exam_router)

# Health check
@app.get("/")
def health():
    return {"status": "ok"}