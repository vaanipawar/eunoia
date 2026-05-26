
import pandas as pd
import numpy as np

def generate_student_data(n=500, seed=42):
    np.random.seed(seed)
    df = pd.DataFrame({
        "attendance_pct":       np.random.normal(75, 15, n).clip(20, 100),
        "assignment_completion": np.random.normal(70, 20, n).clip(0, 100),
        "avg_grade":            np.random.normal(65, 15, n).clip(20, 100),
        "sleep_hours":          np.random.normal(6.5, 1.5, n).clip(3, 10),
        "social_activity":      np.random.randint(1, 6, n).astype(float),   # 1–5 scale
        "physical_activity":    np.random.randint(1, 6, n).astype(float),
        "stress_survey":        np.random.randint(1, 11, n).astype(float),  # 1–10
        "missed_deadlines":     np.random.randint(0, 8, n).astype(float),
        "library_logins":       np.random.randint(0, 20, n).astype(float),
        "lms_time_hours":       np.random.normal(10, 5, n).clip(0, 40),
    })

   
    risk = (
        (100 - df["attendance_pct"]) * 0.25 +
        (100 - df["assignment_completion"]) * 0.20 +
        (100 - df["avg_grade"]) * 0.15 +
        (10 - df["sleep_hours"]) * 5 +
        (6 - df["social_activity"]) * 3 +
        df["stress_survey"] * 4 +
        df["missed_deadlines"] * 3
    )
    # Normalize risk to 0–100, then threshold at 50 for binary label
    risk_norm = (risk - risk.min()) / (risk.max() - risk.min()) * 100
    df["risk_score"] = risk_norm.round(2)
    df["burnout"] = (risk_norm > 50).astype(int)
    return df

if __name__ == "__main__":
    df = generate_student_data(1000)
    df.to_csv("backend/app/ml/training_data.csv", index=False)
    print(df["burnout"].value_counts())
    print(df.head())