from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from database import get_db, Job, User
from services.auth_service import get_current_user

router = APIRouter(prefix="/jobs", tags=["Jobs"])


class JobCreate(BaseModel):
    title: str
    company: Optional[str] = ""
    description: str
    required_skills: Optional[str] = ""
    experience_required: Optional[str] = "0"
    education_required: Optional[str] = "B.Tech"


class JobResponse(BaseModel):
    id: int
    title: str
    company: Optional[str]
    description: str
    required_skills: Optional[str]
    experience_required: Optional[str]
    education_required: Optional[str]
    owner_id: int

    class Config:
        from_attributes = True


@router.post("/", response_model=JobResponse, summary="Create a new job")
def create_job(job: JobCreate, db: Session = Depends(get_db),
               current_user: User = Depends(get_current_user)):
    if current_user.role != "recruiter":
        raise HTTPException(status_code=403, detail="Only recruiters can create jobs")
    db_job = Job(**job.dict(), owner_id=current_user.id)
    db.add(db_job)
    db.commit()
    db.refresh(db_job)
    return db_job


@router.get("/", response_model=List[JobResponse], summary="Get all jobs for recruiter")
def get_jobs(db: Session = Depends(get_db),
             current_user: User = Depends(get_current_user)):
    if current_user.role == "recruiter":
        return db.query(Job).filter(Job.owner_id == current_user.id).all()
    return db.query(Job).all()  # candidates can see all jobs


@router.get("/{job_id}", response_model=JobResponse, summary="Get job by ID")
def get_job(job_id: int, db: Session = Depends(get_db),
            current_user: User = Depends(get_current_user)):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@router.delete("/{job_id}", summary="Delete job")
def delete_job(job_id: int, db: Session = Depends(get_db),
               current_user: User = Depends(get_current_user)):
    job = db.query(Job).filter(Job.id == job_id,
                               Job.owner_id == current_user.id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    db.delete(job)
    db.commit()
    return {"message": "Job deleted successfully"}
