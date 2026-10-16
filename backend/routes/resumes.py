import os
import json
import shutil
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db, Job, ResumeAnalysis, User
from services.auth_service import get_current_user
from services.resume_parser import parse_resume
from services.ai_matcher import match_resume_to_job

router = APIRouter(prefix="/resumes", tags=["Resumes"])
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/upload/{job_id}", summary="Upload resume and get AI analysis")
async def upload_resume(
    job_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Validate file type
    if not file.filename.lower().endswith((".pdf", ".docx")):
        raise HTTPException(status_code=400,
                            detail="Only PDF and DOCX files are accepted")

    # Get job
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # Save file
    file_path = os.path.join(UPLOAD_DIR, f"{job_id}_{file.filename}")
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Parse resume
    resume_data = parse_resume(file_path)
    if not resume_data:
        raise HTTPException(status_code=422, detail="Could not extract text from file")

    # AI Matching
    job_dict = {
        "description": job.description,
        "required_skills": job.required_skills or "",
        "experience_required": job.experience_required or "0",
        "education_required": job.education_required or "B.Tech",
    }
    match_result = match_resume_to_job(resume_data, job_dict)

    # Save to DB
    analysis = ResumeAnalysis(
        candidate_name=resume_data.get("name", "Unknown"),
        candidate_email=resume_data.get("email", ""),
        file_path=file_path,
        original_filename=file.filename,
        extracted_skills=json.dumps(resume_data.get("skills", [])),
        extracted_experience=str(resume_data.get("experience_years", 0)),
        extracted_education=resume_data.get("education", "Not Specified"),
        match_score=match_result["match_score"],
        skill_score=match_result["skill_score"],
        experience_score=match_result["experience_score"],
        keyword_score=match_result["keyword_score"],
        missing_skills=json.dumps(match_result["missing_skills"]),
        improvement_suggestions=json.dumps(match_result["improvement_suggestions"]),
        job_id=job_id
    )
    db.add(analysis)
    db.commit()
    db.refresh(analysis)

    return {
        "id": analysis.id,
        "candidate_name": analysis.candidate_name,
        "candidate_email": analysis.candidate_email,
        "extracted_skills": resume_data.get("skills", []),
        "extracted_education": analysis.extracted_education,
        "extracted_experience_years": resume_data.get("experience_years", 0),
        "match_score": match_result["match_score"],
        "skill_score": match_result["skill_score"],
        "experience_score": match_result["experience_score"],
        "keyword_score": match_result["keyword_score"],
        "matched_skills": match_result["matched_skills"],
        "missing_skills": match_result["missing_skills"],
        "improvement_suggestions": match_result["improvement_suggestions"],
        "message": "Resume analyzed successfully!"
    }


@router.get("/job/{job_id}", summary="Get all resumes for a job (ranked)")
def get_resumes_for_job(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    analyses = (
        db.query(ResumeAnalysis)
        .filter(ResumeAnalysis.job_id == job_id)
        .order_by(ResumeAnalysis.match_score.desc())  # Ranked by score!
        .all()
    )
    result = []
    for a in analyses:
        result.append({
            "id": a.id,
            "candidate_name": a.candidate_name,
            "candidate_email": a.candidate_email,
            "original_filename": a.original_filename,
            "extracted_education": a.extracted_education,
            "extracted_experience": a.extracted_experience,
            "extracted_skills": json.loads(a.extracted_skills or "[]"),
            "match_score": a.match_score,
            "skill_score": a.skill_score,
            "experience_score": a.experience_score,
            "keyword_score": a.keyword_score,
            "missing_skills": json.loads(a.missing_skills or "[]"),
            "improvement_suggestions": json.loads(a.improvement_suggestions or "[]"),
            "is_shortlisted": a.is_shortlisted,
            "uploaded_at": a.uploaded_at.isoformat() if a.uploaded_at else None
        })
    return result


@router.patch("/{resume_id}/shortlist", summary="Toggle shortlist status")
def toggle_shortlist(
    resume_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    analysis = db.query(ResumeAnalysis).filter(ResumeAnalysis.id == resume_id).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="Resume not found")
    analysis.is_shortlisted = not analysis.is_shortlisted
    db.commit()
    return {"id": resume_id, "is_shortlisted": analysis.is_shortlisted}


@router.delete("/{resume_id}", summary="Delete resume analysis")
def delete_resume(
    resume_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    analysis = db.query(ResumeAnalysis).filter(ResumeAnalysis.id == resume_id).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="Resume not found")
    # Delete file from disk
    if os.path.exists(analysis.file_path):
        os.remove(analysis.file_path)
    db.delete(analysis)
    db.commit()
    return {"message": "Resume deleted"}
