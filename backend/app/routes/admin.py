from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.auth import get_current_user
from app.models.user import User, UserRole
from app.models.burnout import BurnoutScore
from app.models.chat import ChatSession

router = APIRouter(prefix="/api/admin", tags=["admin"])


def require_admin(current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Admin only")
    return current_user


@router.get("/students")
def get_students(
    db: Session = Depends(get_db),
    _=Depends(require_admin)
):
    students = db.query(User).filter(User.role == UserRole.student).all()
    result = []
    for s in students:
        latest = db.query(BurnoutScore).filter(
            BurnoutScore.student_id == s.id
        ).order_by(BurnoutScore.predicted_at.desc()).first()
        result.append({
            "id": str(s.id),
            "full_name": s.full_name,
            "email": s.email,
            "department": s.department,
            "risk_level": latest.risk_level if latest else None,
            "risk_score": round(latest.risk_score * 100, 1) if latest else None,
            "last_assessed": latest.predicted_at if latest else None,
        })
    return result


@router.get("/students/{student_id}/history")
def get_student_history(
    student_id: str,
    db: Session = Depends(get_db),
    _=Depends(require_admin)
):
    student = db.query(User).filter(User.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    sessions = db.query(ChatSession).filter(
        ChatSession.student_id == student_id
    ).order_by(ChatSession.started_at.desc()).all()

    return {
        "student": {
            "id": str(student.id),
            "full_name": student.full_name,
            "email": student.email,
            "department": student.department,
        },
        "sessions": [
            {
                "session_id": str(s.id),
                "status": s.status,
                "stress_level": s.stress_level,
                "started_at": s.started_at,
                "closed_at": s.closed_at,
                "mentor_assigned": s.mentor_assigned,
                "summary": s.summary,
                "messages": [
                    {
                        "role": m.role,
                        "content": m.content,
                        "time": m.created_at
                    }
                    for m in s.messages
                ]
            }
            for s in sessions
        ]
    }


@router.get("/students/{student_id}/burnout-history")
def get_student_burnout_history(
    student_id: str,
    db: Session = Depends(get_db),
    _=Depends(require_admin)
):
    scores = db.query(BurnoutScore).filter(
        BurnoutScore.student_id == student_id
    ).order_by(BurnoutScore.predicted_at.desc()).all()
    return [
        {
            "week": s.week_number,
            "risk_score": round(s.risk_score * 100, 1),
            "risk_level": s.risk_level,
            "predicted_at": s.predicted_at,
        }
        for s in scores
    ]
@router.get("/mentors")
def get_mentors(db: Session = Depends(get_db), _=Depends(require_admin)):
    from app.models.mentor_profile import MentorProfile
    from app.models.mentor import MentorAssignment
    mentors = db.query(User).filter(
        User.role == UserRole.mentor,
        User.is_active == True
    ).all()
    result = []
    for m in mentors:
        profile = db.query(MentorProfile).filter(MentorProfile.mentor_id == m.id).first()
        active_cases = db.query(MentorAssignment).filter(
            MentorAssignment.mentor_id == m.id,
            MentorAssignment.status == "active"
        ).count()
        result.append({
            "id": str(m.id),
            "full_name": m.full_name,
            "email": m.email,
            "department": m.department,
            "specializations": profile.specializations if profile else [],
            "experience_years": profile.experience_years if profile else 0,
            "languages": profile.languages if profile else [],
            "availability": profile.availability if profile else "available",
            "bio": profile.bio if profile else None,
            "active_cases": active_cases,
        })
    return result

@router.get("/pending-mentors")
def get_pending_mentors(db: Session = Depends(get_db), _=Depends(require_admin)):
    from app.models.mentor_profile import MentorProfile
    mentors = db.query(User).filter(
        User.role == UserRole.mentor,
        User.is_active == False
    ).all()
    result = []
    for m in mentors:
        profile = db.query(MentorProfile).filter(MentorProfile.mentor_id == m.id).first()
        result.append({
            "id": str(m.id),
            "full_name": m.full_name,
            "email": m.email,
            "department": m.department,
            "specializations": profile.specializations if profile else [],
            "experience_years": profile.experience_years if profile else 0,
            "languages": profile.languages if profile else [],
            "bio": profile.bio if profile else None,
        })
    return result

@router.post("/approve-mentor/{mentor_id}")
def approve_mentor(
    mentor_id: str,
    db: Session = Depends(get_db),
    _=Depends(require_admin)
):
    from app.services.email_service import send_mentor_approved_email
    mentor = db.query(User).filter(User.id == mentor_id).first()
    if not mentor:
        raise HTTPException(status_code=404, detail="Mentor not found")
    mentor.is_active = True
    db.commit()
    send_mentor_approved_email(mentor.email, mentor.full_name)
    return {"message": "Mentor approved"}

@router.delete("/reject-mentor/{mentor_id}")
def reject_mentor(
    mentor_id: str,
    db: Session = Depends(get_db),
    _=Depends(require_admin)
):
    mentor = db.query(User).filter(User.id == mentor_id).first()
    if not mentor:
        raise HTTPException(status_code=404, detail="Mentor not found")
    db.delete(mentor)
    db.commit()
    return {"message": "Mentor rejected"}

@router.post("/run-predictions")
def run_predictions_manually(
    db: Session = Depends(get_db),
    _=Depends(require_admin)
):
    from app.tasks.prediction_tasks import run_weekly_predictions
    run_weekly_predictions.delay()
    return {"message": "Predictions triggered"}