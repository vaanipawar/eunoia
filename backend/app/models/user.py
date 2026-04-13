from sqlalchemy import Column, String, Boolean, DateTime, Enum, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
import enum
from datetime import datetime
from app.core.database import Base


class UserRole(str, enum.Enum):
    student = "student"
    mentor = "mentor"
    admin = "admin"


class User(Base):
    __tablename__ = "users"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, nullable=False, index=True)
    full_name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(UserRole), default=UserRole.student)
    department = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    year_of_study = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    burnout_scores = relationship("BurnoutScore", back_populates="student",
                                  foreign_keys="BurnoutScore.student_id")
    chat_sessions = relationship("ChatSession", back_populates="student",
                                 foreign_keys="ChatSession.student_id")