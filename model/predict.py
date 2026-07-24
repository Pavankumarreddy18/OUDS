"""
Oral Ulcer Diagnosis - Prediction Script
==========================================
Takes patient data as JSON input, returns diagnosis prediction as JSON.
Called by Node.js server via child_process.

Usage: echo '{"age":45,...}' | python predict.py
"""

import sys
import json
import os
import numpy as np

# Suppress XGBoost warnings
import warnings
warnings.filterwarnings("ignore")

import xgboost as xgb

MODEL_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(MODEL_DIR, "ulcer_model.json")
ENCODERS_PATH = os.path.join(MODEL_DIR, "encoders.json")
METADATA_PATH = os.path.join(MODEL_DIR, "model_metadata.json")
DIAGNOSIS_META_PATH = os.path.join(MODEL_DIR, "diagnosis_meta.json")

# ─── Load model and encoders at startup ──────────────────────

with open(ENCODERS_PATH, "r") as f:
    encoders = json.load(f)

with open(METADATA_PATH, "r") as f:
    metadata = json.load(f)

with open(DIAGNOSIS_META_PATH, "r") as f:
    diagnosis_meta = json.load(f)

model = xgb.XGBClassifier()
model.load_model(MODEL_PATH)

FEATURE_COLUMNS = metadata["feature_columns"]
CATEGORICAL_COLUMNS = metadata["categorical_columns"]
CLASSES = metadata["classes"]


def encode_input(patient_data):
    """Convert patient form data into model-ready feature vector."""
    features = []

    for col in FEATURE_COLUMNS:
        val = patient_data.get(col, "")

        # Handle boolean fields (from JS they come as true/false or 1/0)
        if isinstance(val, bool):
            val = 1 if val else 0
        elif val is True:
            val = 1
        elif val is False or val is None:
            val = 0

        # Encode categorical columns
        if col in CATEGORICAL_COLUMNS:
            val_str = str(val) if val else ""
            mapping = encoders.get(col, {}).get("mapping", {})
            if val_str in mapping:
                val = mapping[val_str]
            else:
                # Unknown category - use 0 (most common)
                val = 0

        # Ensure numeric
        try:
            val = float(val)
        except (ValueError, TypeError):
            val = 0.0

        features.append(val)

    return np.array([features])


def predict(patient_data):
    """Run prediction and return structured result."""
    X = encode_input(patient_data)

    # Get probability distribution across all classes
    proba = model.predict_proba(X)[0]

    # Top 3 predictions
    top_indices = np.argsort(proba)[::-1][:3]
    top_predictions = []
    for idx in top_indices:
        diagnosis_name = CLASSES[idx]
        meta = diagnosis_meta.get(diagnosis_name, {})
        top_predictions.append({
            "diagnosis": diagnosis_name,
            "confidence": round(float(proba[idx]), 4),
            "risk_level": meta.get("risk_level", "UNKNOWN"),
            "urgency": meta.get("urgency", "ROUTINE"),
        })

    primary = top_predictions[0]

    return {
        "success": True,
        "primary_diagnosis": primary["diagnosis"],
        "confidence": primary["confidence"],
        "risk_level": primary["risk_level"],
        "urgency": primary["urgency"],
        "top_predictions": top_predictions,
        "model_version": "1.0",
        "model_accuracy": metadata.get("test_accuracy", 0),
    }


if __name__ == "__main__":
    try:
        # Read JSON input from stdin
        input_data = json.loads(sys.stdin.read())
        result = predict(input_data)
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({
            "success": False,
            "error": str(e),
        }))
        sys.exit(1)
