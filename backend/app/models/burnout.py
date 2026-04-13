# backend/app/models/burnout.py
from sqlalchemy import Column, Float, String, DateTime, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
from app.core.database import Base

class BurnoutScore(Base):
    __tablename__ = "burnout_scores"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    risk_score = Column(Float, nullable=False)          # 0.0 – 1.0
    risk_level = Column(String, nullable=False)         # low / medium / high
    features_used = Column(JSON, nullable=True)         # snapshot of input features
    predicted_at = Column(DateTime, default=datetime.utcnow)
    week_number = Column(String, nullable=True)         # e.g. "2024-W22"

    student = relationship("User", back_populates="burnout_scores")