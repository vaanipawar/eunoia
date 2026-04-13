from celery import Celery
from celery.schedules import crontab
from app.core.config import settings

celery_app = Celery(
    "eunoia",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=["app.tasks.prediction_tasks"]  # ← this line is the fix
)

celery_app.conf.beat_schedule = {
    "weekly-burnout-prediction": {
        "task": "app.tasks.prediction_tasks.run_weekly_predictions",
        "schedule": crontab(hour=8, minute=0, day_of_week="monday"),
    },
}

celery_app.conf.timezone = "UTC"
celery_app.conf.broker_connection_retry_on_startup = True