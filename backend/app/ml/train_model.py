# backend/app/ml/train_model.py
import pandas as pd
import numpy as np
import joblib, os
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.metrics import classification_report, roc_auc_score
from xgboost import XGBClassifier
from generate_data import generate_student_data

FEATURES = [
    "attendance_pct", "assignment_completion", "avg_grade",
    "sleep_hours", "social_activity", "physical_activity",
    "stress_survey", "missed_deadlines", "library_logins", "lms_time_hours"
]

def train():
    df = generate_student_data(2000)
    X = df[FEATURES]
    y = df["burnout"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    pipeline = Pipeline([
        ("scaler", StandardScaler()),
        ("model", XGBClassifier(
            n_estimators=200,
            max_depth=5,
            learning_rate=0.05,
            subsample=0.8,
            colsample_bytree=0.8,
            eval_metric="logloss",
            random_state=42,
            use_label_encoder=False,
        ))
    ])

    pipeline.fit(X_train, y_train)

    y_pred = pipeline.predict(X_test)
    y_prob = pipeline.predict_proba(X_test)[:, 1]

    print("\n=== Model Evaluation ===")
    print(classification_report(y_test, y_pred))
    print(f"ROC-AUC Score: {roc_auc_score(y_test, y_prob):.4f}")

    # Feature importance
    model = pipeline.named_steps["model"]
    importance = dict(zip(FEATURES, model.feature_importances_))
    importance = dict(sorted(importance.items(), key=lambda x: x[1], reverse=True))
    print("\n=== Feature Importance ===")
    for feat, imp in importance.items():
        print(f"  {feat:<30} {imp:.4f}")

    os.makedirs("backend/app/ml/artifacts", exist_ok=True)
    joblib.dump(pipeline, "backend/app/ml/artifacts/burnout_model.pkl")
    joblib.dump(FEATURES, "backend/app/ml/artifacts/feature_names.pkl")
    print("\nModel saved to backend/app/ml/artifacts/")

if __name__ == "__main__":
    train()
    