
from app.core.celery_app import celery_app
from app.core.database import SessionLocal
from app.models.user import User, UserRole
from app.models.burnout import BurnoutScore
from app.ml.predictor import predict_batch
from app.services.email_service import send_burnout_alert
from datetime import datetime

@celery_app.task(name="app.tasks.prediction_tasks.run_weekly_predictions")
def run_weekly_predictions():
    db = SessionLocal()
    try:
        students = db.query(User).filter(
            User.role == UserRole.student,
            User.is_active == True
        ).all()

    
        # Here we use stored survey data or defaults
        student_features = []
        for s in students:
            # In real app it fetch from academic records table
            student_features.append({
                "student_id": str(s.id),
                "attendance_pct": 75.0,        # replace with real data
                "assignment_completion": 70.0,
                "avg_grade": 65.0,
                "sleep_hours": 6.5,
                "social_activity": 3.0,
                "physical_activity": 3.0,
                "stress_survey": 5.0,
                "missed_deadlines": 1.0,
                "library_logins": 5.0,
                "lms_time_hours": 10.0,
            })

        results = predict_batch(student_features)
        week = datetime.utcnow().strftime("%Y-W%W")

        for result in results:
            score = BurnoutScore(
                student_id=result["student_id"],
                risk_score=result["risk_score"] / 100,
                risk_level=result["risk_level"],
                week_number=week,
            )
            db.add(score)

            # Email high-risk students
            if result["risk_level"] == "high":
                student = db.query(User).filter(
                    User.id == result["student_id"]
                ).first()
                if student:
                    send_burnout_alert(student.email, student.full_name)

        db.commit()
        return f"Predicted {len(results)} students for {week}"
    finally:
        db.close()