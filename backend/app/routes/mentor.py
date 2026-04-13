from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.core.database import get_db
from app.core.auth import get_current_user
from app.models.user import User
from app.models.mentor_profile import MentorProfile

router = APIRouter(prefix="/api/mentor", tags=["mentor"])


class UpdateAssignment(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None


class MentorProfileUpdate(BaseModel):
    bio: Optional[str] = None
    specializations: Optional[list] = None
    availability: Optional[str] = None
    max_students: Optional[int] = None
    experience_years: Optional[int] = None
    languages: Optional[list] = None


@router.get("/profile")
def get_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    profile = db.query(MentorProfile).filter(
        MentorProfile.mentor_id == current_user.id
    ).first()
    if not profile:
        profile = MentorProfile(mentor_id=current_user.id)
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return {
        "full_name": current_user.full_name,
        "email": current_user.email,
        "bio": profile.bio,
        "specializations": profile.specializations or [],
        "availability": profile.availability,
        "max_students": profile.max_students,
        "experience_years": profile.experience_years,
        "languages": profile.languages or [],
    }


@router.patch("/profile")
def update_profile(
    body: MentorProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    profile = db.query(MentorProfile).filter(
        MentorProfile.mentor_id == current_user.id
    ).first()
    if not profile:
        profile = MentorProfile(mentor_id=current_user.id)
        db.add(profile)
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(profile, field, value)
    db.commit()
    return {"message": "Profile updated"}


@router.get("/assignments")
def get_assignments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from app.models.mentor import MentorAssignment
    from app.models.chat import ChatSession

    assignments = db.query(MentorAssignment).filter(
        MentorAssignment.mentor_id == current_user.id
    ).order_by(MentorAssignment.assigned_at.desc()).all()

    result = []
    for a in assignments:
        student = db.query(User).filter(User.id == a.student_id).first()
        session = db.query(ChatSession).filter(ChatSession.id == a.session_id).first()
        result.append({
            "id": str(a.id),
            "student_name": student.full_name if student else "Unknown",
            "student_email": student.email if student else None,
            "status": a.status,
            "notes": a.notes,
            "assigned_at": a.assigned_at,
            "summary": session.summary if session else None,
        })
    return result


@router.patch("/assignments/{assignment_id}")
def update_assignment(
    assignment_id: str,
    body: UpdateAssignment,
    db: Session = Depends(get_db),
    _=Depends(get_current_user)
):
    from app.models.mentor import MentorAssignment

    a = db.query(MentorAssignment).filter(
        MentorAssignment.id == assignment_id
    ).first()
    if not a:
        raise HTTPException(status_code=404, detail="Not found")
    if body.status:
        a.status = body.status
    if body.notes is not None:
        a.notes = body.notes
    db.commit()
    return {"ok": True}