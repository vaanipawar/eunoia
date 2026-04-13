import secrets
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.core.database import get_db
from app.core.auth import verify_password, create_access_token, hash_password, get_current_user
from app.models.user import User, UserRole
from app.models.password_reset import PasswordResetToken
from app.services.email_service import send_password_reset_email

router = APIRouter(prefix="/api/auth", tags=["auth"])

class RegisterRequest(BaseModel):
    email: str
    full_name: str
    password: str
    role: UserRole = UserRole.student
    department: Optional[str] = None
    phone: Optional[str] = None
    year_of_study: Optional[str] = None
    bio: Optional[str] = None
    experience_years: Optional[int] = 0
    languages: Optional[list] = []
    specializations: Optional[list] = []

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

@router.post("/register")
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == req.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    if req.role == UserRole.admin:
        raise HTTPException(status_code=403, detail="Admin accounts cannot be self-registered")

    # Mentors start as inactive until admin approves
    is_active = req.role != UserRole.mentor

    user = User(
        email=req.email,
        full_name=req.full_name,
        hashed_password=hash_password(req.password),
        role=req.role,
        department=req.department,
        phone=getattr(req, 'phone', None),
        year_of_study=getattr(req, 'year_of_study', None),
        is_active=is_active,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # If mentor, save profile details
    if req.role == UserRole.mentor:
        from app.models.mentor_profile import MentorProfile
        profile = MentorProfile(
            mentor_id=user.id,
            bio=getattr(req, 'bio', None),
            specializations=getattr(req, 'specializations', []),
            experience_years=getattr(req, 'experience_years', 0),
            languages=getattr(req, 'languages', []),
        )
        db.add(profile)
        db.commit()
        # Notify admin
        send_mentor_registration_email(user.email, user.full_name)
        return {"message": "Mentor account created. Pending admin approval.", "role": "mentor"}

    token = create_access_token({"sub": str(user.id), "role": user.role})
    return {"access_token": token, "token_type": "bearer", "role": user.role}
    
@router.post("/login")
def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form.username).first()
    if not user or not verify_password(form.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token({"sub": str(user.id), "role": user.role})
    return {"access_token": token, "token_type": "bearer", "role": user.role}

@router.post("/forgot-password")
def forgot_password(req: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    if user:
        token = secrets.token_urlsafe(32)
        reset = PasswordResetToken(
            user_id=user.id,
            token=token,
            expires_at=datetime.utcnow() + timedelta(hours=1),
        )
        db.add(reset)
        db.commit()
        send_password_reset_email(user.email, user.full_name, token)
    return {"message": "If that email exists, a reset link has been sent."}

@router.post("/reset-password")
def reset_password(req: ResetPasswordRequest, db: Session = Depends(get_db)):
    reset = db.query(PasswordResetToken).filter(
        PasswordResetToken.token == req.token,
        PasswordResetToken.used == "no",
        PasswordResetToken.expires_at > datetime.utcnow(),
    ).first()
    if not reset:
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    user = db.query(User).filter(User.id == reset.user_id).first()
    user.hashed_password = hash_password(req.new_password)
    reset.used = "yes"
    db.commit()
    return {"message": "Password reset successfully"}

@router.post("/admin/create-user")
def admin_create_user(
    req: RegisterRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Only admins can create this account type")
    if db.query(User).filter(User.email == req.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(
        email=req.email,
        full_name=req.full_name,
        hashed_password=hash_password(req.password),
        role=req.role,
        department=req.department,
    )
    db.add(user)
    db.commit()
    return {"message": f"{req.role} account created successfully"}