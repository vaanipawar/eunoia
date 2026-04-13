from sqlalchemy import Column, String, DateTime, ForeignKey, JSON, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
from app.core.database import Base

class MentorProfile(Base):
    __tablename__ = "mentor_profiles"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    mentor_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), unique=True, nullable=False)
    bio = Column(String, nullable=True)
    specializations = Column(JSON, default=list)
    availability = Column(String, default="available")
    max_students = Column(Integer, default=5)
    experience_years = Column(Integer, default=0)
    languages = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)

    mentor = relationship("User", foreign_keys=[mentor_id])