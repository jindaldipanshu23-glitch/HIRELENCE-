from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from database import get_db, User
from services.auth_service import hash_password, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/auth", tags=["Auth"])


class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str = "recruiter"  # recruiter or candidate


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    role: str
    name: str


@router.post("/register", summary="Register new user")
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == req.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(
        name=req.name,
        email=req.email,
        hashed_password=hash_password(req.password),
        role=req.role
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_access_token({"sub": user.email, "role": user.role})
    return {"access_token": token, "token_type": "bearer",
            "role": user.role, "name": user.name}


@router.post("/login", response_model=TokenResponse, summary="Login")
def login(form: OAuth2PasswordRequestForm = Depends(),
          db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form.username).first()
    if not user or not verify_password(form.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token({"sub": user.email, "role": user.role})
    return {"access_token": token, "token_type": "bearer",
            "role": user.role, "name": user.name}


@router.post("/switch-role", response_model=TokenResponse, summary="Switch role")
def switch_role(db: Session = Depends(get_db),
                current_user: User = Depends(get_current_user)):
    current_user.role = "candidate" if current_user.role == "recruiter" else "recruiter"
    db.commit()
    db.refresh(current_user)
    token = create_access_token({"sub": current_user.email, "role": current_user.role})
    return {"access_token": token, "token_type": "bearer",
            "role": current_user.role, "name": current_user.name}

