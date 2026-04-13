# backend/app/routes/chat.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime
from app.core.database import get_db
from app.core.auth import get_current_user
from app.models.user import User
from app.models.chat import ChatSession, ChatMessage
from app.services.chatbot import chat, generate_session_summary
from app.services.mentor_service import assign_mentor
from app.services.email_service import send_mentor_assignment_email
import uuid

router = APIRouter(prefix="/api/chat", tags=["chat"])

class MessageRequest(BaseModel):
    message: str
    session_id: str | None = None

@router.post("/message")
def send_message(
    req: MessageRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Get or create session
    session = None
    if req.session_id:
        session = db.query(ChatSession).filter(
            ChatSession.id == req.session_id,
            ChatSession.student_id == current_user.id,
            ChatSession.status == "active",
        ).first()

    if not session:
        session = ChatSession(student_id=current_user.id, status="active")
        db.add(session)
        db.commit()
        db.refresh(session)

    # Load message history
    history = [
        {"role": m.role, "content": m.content}
        for m in session.messages
    ]

    # Call chatbot
    result = chat(
        user_message=req.message,
        history=history,
        stress_level=session.stress_level or "low",
        student_name=current_user.full_name,
    )

    # Update session stress level
    session.stress_level = result["stress_level"]
    db.commit()

    # Save user message
    user_msg = ChatMessage(
        session_id=session.id,
        role="user",
        content=req.message,
        sentiment_score=result["sentiment"]["stress_index"],
    )
    db.add(user_msg)

    # Save assistant message
    bot_msg = ChatMessage(
        session_id=session.id,
        role="assistant",
        content=result["reply"],
    )
    db.add(bot_msg)
    db.commit()

    # If intake complete → summarize → assign mentor
    mentor_info = None
    if result["intake_complete"]:
        session.status = "summarizing"
        db.commit()

        all_messages = [{"role": m.role, "content": m.content} for m in session.messages]
        summary = generate_session_summary(all_messages, current_user.full_name)

        session.summary = summary
        session.status = "closed"
        session.closed_at = datetime.utcnow()
        session.mentor_assigned = True
        db.commit()

        mentor_info = assign_mentor(db, str(current_user.id), str(session.id))

        if mentor_info["assigned"]:
            send_mentor_assignment_email(
                mentor_email=mentor_info["mentor_email"],
                mentor_name=mentor_info["mentor_name"],
                student_name=current_user.full_name,
                summary=summary,
            )

    return {
        "session_id": str(session.id),
        "reply": result["reply"],
        "stress_level": result["stress_level"],
        "intake_complete": result["intake_complete"],
        "mentor_assigned": mentor_info,
    }

@router.get("/sessions")
def get_sessions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    sessions = (
        db.query(ChatSession)
        .filter(ChatSession.student_id == current_user.id)
        .order_by(ChatSession.started_at.desc())
        .all()
    )
    return [
        {
            "session_id": str(s.id),
            "status": s.status,
            "stress_level": s.stress_level,
            "started_at": s.started_at,
            "closed_at": s.closed_at,
            "mentor_assigned": s.mentor_assigned,
            "summary": s.summary,
        }
        for s in sessions
    ]

@router.get("/history/{session_id}")
def get_history(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = db.query(ChatSession).filter(
        ChatSession.id == session_id,
        ChatSession.student_id == current_user.id,
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    return {
        "session_id": str(session.id),
        "stress_level": session.stress_level,
        "status": session.status,
        "summary": session.summary,
        "messages": [
            {"role": m.role, "content": m.content, "created_at": m.created_at}
            for m in session.messages
        ],
    }