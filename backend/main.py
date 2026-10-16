from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from database import create_tables
from routes.auth import router as auth_router
from routes.jobs import router as jobs_router
from routes.resumes import router as resumes_router

load_dotenv()

app = FastAPI(
    title="HireLens AI",
    description="AI-Based Resume Screening, Matching & Improvement System",
    version="1.0.0"
)

import os

# CORS — allow React frontend (local and deployed)
cors_origins_env = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000")
allowed_origins = [origin.strip() for origin in cors_origins_env.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create DB tables on startup
create_tables()

# Register routes
app.include_router(auth_router)
app.include_router(jobs_router)
app.include_router(resumes_router)


@app.get("/", tags=["Health"])
def root():
    return {
        "message": "HireLens AI Backend is running! 🚀",
        "docs": "/docs",
        "version": "1.0.0"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
