from sqlalchemy.orm import Session
from app.models.user import User, UserRole


def assign_mentor(db: Session, student_id: str, session_id: str) -> dict:
    # Import here to avoid circular imports
    from app.models.mentor import MentorAssignment

    mentors = db.query(User).filter(
        User.role == UserRole.mentor,
        User.is_active == True
    ).all()

    if not mentors:
        return {"assigned": False, "reason": "No mentors available"}

    mentor_loads = []
    for mentor in mentors:
        active = db.query(MentorAssignment).filter(
            MentorAssignment.mentor_id == mentor.id,
            MentorAssignment.status == "active"
        ).count()
        mentor_loads.append((mentor, active))

    mentor_loads.sort(key=lambda x: x[1])
    chosen_mentor = mentor_loads[0][0]

    assignment = MentorAssignment(
        student_id=student_id,
        mentor_id=chosen_mentor.id,
        session_id=session_id,
        status="active",
    )
    db.add(assignment)
    db.commit()

    return {
        "assigned": True,
        "mentor_id": str(chosen_mentor.id),
        "mentor_name": chosen_mentor.full_name,
        "mentor_email": chosen_mentor.email,
    }