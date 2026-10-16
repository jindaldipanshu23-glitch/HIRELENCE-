# HireLens AI 🤖

**AI-Based Resume Screening, Matching & Improvement System**

> B.Tech Major Project — AI & Data Science | Academic Session 2026-27

---

## 🚀 Features

### For Recruiters:
- Post job descriptions with required skills, experience & education
- Upload multiple resumes (PDF/DOCX) via drag-and-drop
- AI-powered candidate ranking by match score
- Explainable scoring: Skills (50%) + Keywords (30%) + Experience (20%)
- Shortlist/filter candidates
- View missing skills and improvement suggestions

### For Candidates:
- Upload resume against any job description
- Get real-time AI match score
- See matched & missing skills
- Receive actionable improvement suggestions

### AI/ML Stack:
- **NLP Resume Parsing**: Text extraction from PDF/DOCX + regex-based entity recognition
- **TF-IDF Cosine Similarity**: Resume-to-JD keyword matching
- **Weighted Scoring Model**: Explainable, transparent scoring
- **Skill Gap Analysis**: Identify missing and matched skills

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js + Vite + Tailwind CSS |
| Backend | Python FastAPI |
| Database | SQLite (SQLAlchemy) |
| AI/ML | scikit-learn, PyMuPDF, python-docx |
| Auth | JWT (python-jose) |

---

## 📁 Project Structure

```
Aditi mvp/
├── backend/
│   ├── main.py              # FastAPI app
│   ├── database.py          # DB models
│   ├── requirements.txt
│   ├── routes/
│   │   ├── auth.py          # Register/Login
│   │   ├── jobs.py          # Job CRUD
│   │   └── resumes.py       # Upload & Analysis
│   └── services/
│       ├── resume_parser.py # PDF/DOCX parsing + NLP
│       ├── ai_matcher.py    # Matching engine
│       └── auth_service.py  # JWT utilities
└── frontend/
    ├── src/
    │   ├── pages/
    │   │   ├── Login.jsx
    │   │   ├── Register.jsx
    │   │   ├── RecruiterDashboard.jsx
    │   │   ├── CandidateDashboard.jsx
    │   │   └── JobDetail.jsx
    │   ├── App.jsx
    │   └── api.js
    └── package.json
```

---

## ⚙️ Setup & Run

### Backend
```bash
cd backend
pip install -r requirements.txt
python -m spacy download en_core_web_sm
uvicorn main:app --reload
```
Backend runs at: http://localhost:8000
API Docs: http://localhost:8000/docs

### Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend runs at: http://localhost:5173

---

## 📊 Scoring Model

| Component | Weight | Description |
|-----------|--------|-------------|
| Skill Match | **50%** | % of required skills found in resume |
| Keyword Similarity | **30%** | TF-IDF cosine similarity with JD |
| Experience Match | **20%** | Candidate years vs required years |

---

*Developed as part of B.Tech Major Project (BCS753)*
