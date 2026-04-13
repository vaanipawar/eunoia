import joblib
import os
import pandas as pd
from datetime import datetime

MODEL_PATH = os.path.join(os.path.dirname(__file__), "artifacts/burnout_model.pkl")
FEATURES_PATH = os.path.join(os.path.dirname(__file__), "artifacts/feature_names.pkl")

_model = None
_features = None


def _load():
    global _model, _features
    if _model is None:
        _model = joblib.load(MODEL_PATH)
        _features = joblib.load(FEATURES_PATH)


def predict(student_features: dict) -> dict:
    _load()
    df = pd.DataFrame([student_features])[_features]
    prob = _model.predict_proba(df)[0][1]
    risk_score = round(float(prob) * 100, 1)

    if risk_score < 35:
        risk_level = "low"
    elif risk_score < 65:
        risk_level = "medium"
    else:
        risk_level = "high"

    return {
        "risk_score": risk_score,
        "risk_level": risk_level,
        "burnout": risk_score >= 50,
        "predicted_at": datetime.utcnow().isoformat(),
        "features_used": student_features,
    }


def predict_batch(students: list[dict]) -> list[dict]:
    _load()
    df = pd.DataFrame(students)[_features]
    probs = _model.predict_proba(df)[:, 1]
    results = []
    for i, prob in enumerate(probs):
        score = round(float(prob) * 100, 1)
        level = "low" if score < 35 else "medium" if score < 65 else "high"
        results.append({
            "student_id": students[i].get("student_id"),
            "risk_score": score,
            "risk_level": level,
            "burnout": score >= 50,
        })
    return results