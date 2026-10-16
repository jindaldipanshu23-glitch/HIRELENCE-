from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from typing import Dict, List
import re


def parse_required_skills(skills_text: str) -> List[str]:
    """Parse comma-separated required skills from JD"""
    if not skills_text:
        return []
    return [s.strip().lower() for s in skills_text.split(",") if s.strip()]


def compute_skill_score(resume_skills: List[str], required_skills: List[str]) -> Dict:
    """Calculate skill match score and find missing skills"""
    if not required_skills:
        return {"score": 100.0, "matched": [], "missing": []}

    resume_skills_lower = [s.lower() for s in resume_skills]
    matched = []
    missing = []

    for skill in required_skills:
        if any(skill in rs or rs in skill for rs in resume_skills_lower):
            matched.append(skill)
        else:
            missing.append(skill)

    score = (len(matched) / len(required_skills)) * 100 if required_skills else 0
    return {
        "score": round(score, 2),
        "matched": matched,
        "missing": missing
    }


def compute_experience_score(candidate_years: int, required_years: int) -> float:
    """Calculate experience match score"""
    if required_years == 0:
        return 100.0
    if candidate_years >= required_years:
        return 100.0
    ratio = candidate_years / required_years
    return round(ratio * 100, 2)


def compute_education_score(candidate_edu: str, required_edu: str) -> float:
    """Calculate education match score"""
    edu_rank = {
        "10th": 1, "12th": 2, "Diploma": 3,
        "B.Sc": 4, "BCA": 4, "B.Tech": 5,
        "MBA": 6, "M.Sc": 6, "M.Tech": 7,
        "PhD": 8, "Not Specified": 3
    }
    candidate_rank = edu_rank.get(candidate_edu, 3)
    required_rank = edu_rank.get(required_edu, 3)

    if candidate_rank >= required_rank:
        return 100.0
    ratio = candidate_rank / required_rank
    return round(ratio * 100, 2)


def compute_keyword_score(resume_text: str, jd_text: str) -> float:
    """TF-IDF Cosine Similarity between resume and JD"""
    try:
        vectorizer = TfidfVectorizer(stop_words="english", ngram_range=(1, 2))
        tfidf_matrix = vectorizer.fit_transform([resume_text, jd_text])
        similarity = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])
        return round(float(similarity[0][0]) * 100, 2)
    except Exception:
        return 0.0


def compute_overall_score(skill_score: float, exp_score: float,
                          keyword_score: float) -> float:
    """Weighted overall match score"""
    # Weights: Skills 50%, Keywords 30%, Experience 20%
    overall = (skill_score * 0.50) + (keyword_score * 0.30) + (exp_score * 0.20)
    return round(overall, 2)


def generate_suggestions(missing_skills: List[str], exp_score: float,
                         edu_score: float, keyword_score: float) -> List[str]:
    """Generate improvement suggestions for candidate"""
    suggestions = []

    if missing_skills:
        top_missing = missing_skills[:5]
        suggestions.append(
            f"Add these missing skills to your resume: {', '.join(top_missing)}"
        )

    if keyword_score < 50:
        suggestions.append(
            "Your resume has low keyword overlap with the job description. "
            "Use more job-relevant terms and phrases."
        )

    if exp_score < 60:
        suggestions.append(
            "You may have less experience than required. Highlight internships, "
            "projects, and freelance work to compensate."
        )

    if edu_score < 80:
        suggestions.append(
            "Your education level may be below what is required. "
            "Emphasize relevant certifications and online courses."
        )

    if keyword_score >= 70 and not missing_skills:
        suggestions.append(
            "Great match! Ensure your resume has quantifiable achievements "
            "(e.g., 'Improved accuracy by 15%') for better impact."
        )

    if not suggestions:
        suggestions.append(
            "Your resume looks good! Tailor the summary section specifically "
            "for this job role."
        )

    return suggestions


def match_resume_to_job(resume_data: Dict, job: Dict) -> Dict:
    """
    Main matching function.
    Returns explainable scores and suggestions.
    """
    required_skills = parse_required_skills(job.get("required_skills", ""))

    # Parse required experience from string like "2+ years" or "3 years"
    exp_text = job.get("experience_required", "0")
    exp_match = re.search(r'(\d+)', str(exp_text))
    required_years = int(exp_match.group(1)) if exp_match else 0

    required_edu = job.get("education_required", "Not Specified")

    # Compute individual scores
    skill_result = compute_skill_score(
        resume_data.get("skills", []), required_skills
    )
    exp_score = compute_experience_score(
        resume_data.get("experience_years", 0), required_years
    )
    edu_score = compute_education_score(
        resume_data.get("education", "Not Specified"), required_edu
    )
    keyword_score = compute_keyword_score(
        resume_data.get("raw_text", ""),
        job.get("description", "")
    )

    overall_score = compute_overall_score(
        skill_result["score"], exp_score, keyword_score
    )

    suggestions = generate_suggestions(
        skill_result["missing"], exp_score, edu_score, keyword_score
    )

    return {
        "match_score": overall_score,
        "skill_score": skill_result["score"],
        "experience_score": exp_score,
        "keyword_score": keyword_score,
        "education_score": edu_score,
        "matched_skills": skill_result["matched"],
        "missing_skills": skill_result["missing"],
        "improvement_suggestions": suggestions,
    }
