"""
Oral Ulcer Diagnosis - Model Training Script
==============================================
Trains an XGBoost multi-class classifier on the synthetic dataset.
Exports: model file + label encoders for Node.js integration.
"""

import os
import json
import pandas as pd
import numpy as np
from sklearn.model_selection import cross_val_score, train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import classification_report, confusion_matrix
import xgboost as xgb
import joblib

MODEL_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_PATH = os.path.join(MODEL_DIR, "dataset.csv")
MODEL_PATH = os.path.join(MODEL_DIR, "ulcer_model.json")
ENCODERS_PATH = os.path.join(MODEL_DIR, "encoders.json")
METADATA_PATH = os.path.join(MODEL_DIR, "model_metadata.json")


def train():
    print("=" * 60)
    print("  ORAL ULCER DIAGNOSIS MODEL TRAINING")
    print("=" * 60)

    # ─── Load Data ───────────────────────────────────────────
    df = pd.read_csv(DATASET_PATH)
    print(f"\n[DATA] Loaded {len(df)} rows, {len(df.columns)} columns")

    # ─── Separate features and labels ────────────────────────
    label_cols = ["diagnosis", "risk_level", "urgency"]
    feature_cols = [c for c in df.columns if c not in label_cols]

    X = df[feature_cols].copy()
    y_diagnosis = df["diagnosis"].copy()
    y_risk = df["risk_level"].copy()
    y_urgency = df["urgency"].copy()

    # ─── Encode categorical features ────────────────────────
    categorical_cols = X.select_dtypes(include=["object"]).columns.tolist()
    encoders = {}

    for col in categorical_cols:
        le = LabelEncoder()
        X[col] = le.fit_transform(X[col].astype(str))
        encoders[col] = {
            "classes": le.classes_.tolist(),
            "mapping": {cls: int(idx) for idx, cls in enumerate(le.classes_)},
        }

    # Encode target labels
    le_diagnosis = LabelEncoder()
    y_encoded = le_diagnosis.fit_transform(y_diagnosis)
    encoders["diagnosis"] = {
        "classes": le_diagnosis.classes_.tolist(),
        "mapping": {cls: int(idx) for idx, cls in enumerate(le_diagnosis.classes_)},
    }

    le_risk = LabelEncoder()
    y_risk_encoded = le_risk.fit_transform(y_risk)
    encoders["risk_level"] = {
        "classes": le_risk.classes_.tolist(),
        "mapping": {cls: int(idx) for idx, cls in enumerate(le_risk.classes_)},
    }

    le_urgency = LabelEncoder()
    y_urgency_encoded = le_urgency.fit_transform(y_urgency)
    encoders["urgency"] = {
        "classes": le_urgency.classes_.tolist(),
        "mapping": {cls: int(idx) for idx, cls in enumerate(le_urgency.classes_)},
    }

    # ─── Save encoders ──────────────────────────────────────
    with open(ENCODERS_PATH, "w") as f:
        json.dump(encoders, f, indent=2)
    print(f"[OK] Saved encoders to {ENCODERS_PATH}")

    # ─── Train/Test Split ────────────────────────────────────
    X_train, X_test, y_train, y_test = train_test_split(
        X, y_encoded, test_size=0.2, random_state=42, stratify=y_encoded
    )
    print(f"[SPLIT] Train: {len(X_train)}, Test: {len(X_test)}")

    # ─── Train XGBoost ───────────────────────────────────────
    print("\n[TRAINING] XGBoost multi-class classifier...")

    model = xgb.XGBClassifier(
        n_estimators=300,
        max_depth=8,
        learning_rate=0.1,
        subsample=0.8,
        colsample_bytree=0.8,
        min_child_weight=3,
        gamma=0.1,
        reg_alpha=0.1,
        reg_lambda=1.0,
        objective="multi:softprob",
        num_class=len(le_diagnosis.classes_),
        random_state=42,
        eval_metric="mlogloss",
        use_label_encoder=False,
    )

    model.fit(
        X_train, y_train,
        eval_set=[(X_test, y_test)],
        verbose=False,
    )

    # ─── Evaluate ────────────────────────────────────────────
    y_pred = model.predict(X_test)
    accuracy = (y_pred == y_test).mean()

    print(f"\n[RESULT] Test Accuracy: {accuracy:.4f} ({accuracy*100:.1f}%)")

    print("\n[REPORT] Classification Report:")
    report = classification_report(
        y_test, y_pred,
        target_names=le_diagnosis.classes_,
        output_dict=True,
    )
    report_text = classification_report(
        y_test, y_pred,
        target_names=le_diagnosis.classes_,
    )
    print(report_text)

    # ─── Cross Validation ────────────────────────────────────
    print("[CV] Running 5-fold cross validation...")
    cv_scores = cross_val_score(model, X, y_encoded, cv=5, scoring="accuracy")
    print(f"[CV] Scores: {cv_scores}")
    print(f"[CV] Mean: {cv_scores.mean():.4f} (+/- {cv_scores.std()*2:.4f})")

    # ─── Feature Importance ──────────────────────────────────
    importance = dict(zip(feature_cols, model.feature_importances_.tolist()))
    top_features = sorted(importance.items(), key=lambda x: -x[1])[:10]
    print("\n[FEATURES] Top 10 most important features:")
    for feat, imp in top_features:
        print(f"  {feat:30s} {imp:.4f}")

    # ─── Save Model ──────────────────────────────────────────
    model.save_model(MODEL_PATH)
    print(f"\n[OK] Model saved to {MODEL_PATH}")

    # ─── Save Metadata ───────────────────────────────────────
    metadata = {
        "model_type": "XGBoost",
        "n_estimators": 300,
        "max_depth": 8,
        "n_classes": len(le_diagnosis.classes_),
        "classes": le_diagnosis.classes_.tolist(),
        "risk_classes": le_risk.classes_.tolist(),
        "urgency_classes": le_urgency.classes_.tolist(),
        "feature_columns": feature_cols,
        "categorical_columns": categorical_cols,
        "test_accuracy": float(accuracy),
        "cv_mean_accuracy": float(cv_scores.mean()),
        "cv_std": float(cv_scores.std()),
        "feature_importance": {k: float(v) for k, v in top_features},
        "per_class_f1": {
            cls: float(report[cls]["f1-score"])
            for cls in le_diagnosis.classes_
        },
        "dataset_size": len(df),
    }

    with open(METADATA_PATH, "w") as f:
        json.dump(metadata, f, indent=2)
    print(f"[OK] Metadata saved to {METADATA_PATH}")

    # ─── Risk/Urgency Mapping (deterministic) ────────────────
    # Since risk and urgency are deterministic per diagnosis,
    # save a direct mapping for the Node.js server
    risk_urgency_map = {}
    for _, row in df.drop_duplicates("diagnosis").iterrows():
        risk_urgency_map[row["diagnosis"]] = {
            "risk_level": row["risk_level"],
            "urgency": row["urgency"],
        }

    map_path = os.path.join(MODEL_DIR, "diagnosis_meta.json")
    with open(map_path, "w") as f:
        json.dump(risk_urgency_map, f, indent=2)
    print(f"[OK] Diagnosis metadata saved to {map_path}")

    print("\n" + "=" * 60)
    print(f"  TRAINING COMPLETE - Accuracy: {accuracy*100:.1f}%")
    print("=" * 60)


if __name__ == "__main__":
    train()
