# backend/app/routes/prediction.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.core.database import get_db
from app.core.auth import get_current_user
from app.models.user import User, UserRole
from app.models.burnout import BurnoutScore
from app.ml.predictor import predict
import uuid

router = APIRouter(prefix="/api/predict", tags=["prediction"])

class PredictRequest(BaseModel):
    attendance_pct: float
    assignment_completion: float
    avg_grade: float
    sleep_hours: float
    social_activity: float
    physical_activity: float
    stress_survey: float
    missed_deadlines: float
    library_logins: float
    lms_time_hours: float

@router.post("/")
def predict_burnout(
    req: PredictRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    features = req.model_dump()
    result = predict(features)

    # Save to DB
    score = BurnoutScore(
        student_id=current_user.id,
        risk_score=result["risk_score"] / 100,
        risk_level=result["risk_level"],
        features_used=features,
        week_number=datetime.utcnow().strftime("%Y-W%W"),
    )
    db.add(score)
    db.commit()

    return result

@router.get("/history")
def get_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    scores = (
        db.query(BurnoutScore)
        .filter(BurnoutScore.student_id == current_user.id)
        .order_by(BurnoutScore.predicted_at.desc())
        .limit(12)
        .all()
    )
    return [
        {
            "week": s.week_number,
            "risk_score": round(s.risk_score * 100, 1),
            "risk_level": s.risk_level,
            "predicted_at": s.predicted_at,
        }
        for s in scores
    ]