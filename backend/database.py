from sqlalchemy import create_engine, Column, Integer, String, Float, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import os

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./hirelens.db")

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="recruiter")  # recruiter or candidate
    created_at = Column(DateTime, default=datetime.utcnow)
    jobs = relationship("Job", back_populates="owner")


class Job(Base):
    __tablename__ = "jobs"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    company = Column(String)
    description = Column(Text, nullable=False)
    required_skills = Column(Text)   # comma-separated
    experience_required = Column(String)
    education_required = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    owner_id = Column(Integer, ForeignKey("users.id"))
    owner = relationship("User", back_populates="jobs")
    resumes = relationship("ResumeAnalysis", back_populates="job")


class ResumeAnalysis(Base):
    __tablename__ = "resume_analyses"
    id = Column(Integer, primary_key=True, index=True)
    candidate_name = Column(String)
    candidate_email = Column(String)
    file_path = Column(String)
    original_filename = Column(String)
    extracted_skills = Column(Text)
    extracted_experience = Column(Text)
    extracted_education = Column(Text)
    match_score = Column(Float, default=0.0)
    skill_score = Column(Float, default=0.0)
    experience_score = Column(Float, default=0.0)
    keyword_score = Column(Float, default=0.0)
    missing_skills = Column(Text)
    improvement_suggestions = Column(Text)
    is_shortlisted = Column(Boolean, default=False)
    job_id = Column(Integer, ForeignKey("jobs.id"))
    job = relationship("Job", back_populates="resumes")
    uploaded_at = Column(DateTime, default=datetime.utcnow)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_tables():
    Base.metadata.create_all(bind=engine)
