"""
Oral Ulcer Diagnosis - Synthetic Dataset Generator
====================================================
Generates 2,500+ labeled cases based on clinical decision rules
from oral pathology textbooks and WHO classification.

Each case maps the exact form fields from the OUDS app to a diagnosis.
"""

import csv
import random
import os

random.seed(42)  # Reproducible

OUTPUT_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_FILE = os.path.join(OUTPUT_DIR, "dataset.csv")

# ─── Feature Definitions (match the app's 10-step form) ─────────────────────

GENDERS = ["Male", "Female", "Other"]
TOBACCO_OPTIONS = ["Never", "Occasionally", "Daily", "Quit recently"]
ALCOHOL_OPTIONS = ["Never", "Occasionally", "Weekly", "Daily"]
BETEL_OPTIONS = ["Never", "Occasionally", "Daily", "Multiple times a day"]
DURATION_OPTIONS = ["1-3 days", "4-7 days", "1-2 weeks", "2-4 weeks", "1-3 months", ">3 months"]
RECURRENCE_OPTIONS = ["First time", "Recurring"]
NUMBER_OPTIONS = ["1", "2-3", "4-5", "More than 5"]
SIZE_OPTIONS = ["<5mm", "5-10mm", "10-20mm", ">20mm"]
SHAPE_OPTIONS = ["Round", "Oval", "Irregular", "Crater-like"]
COLOR_OPTIONS = ["White", "White with red border", "Red", "White/Grey", "Yellow", "Mixed red and white"]
BORDER_OPTIONS = ["Smooth", "Raised", "Irregular", "Rolled/Hard"]
LOCATION_OPTIONS = ["Inside cheek", "Tongue (side)", "Tongue (top)", "Lower lip", "Upper lip",
                    "Gums", "Floor of mouth", "Hard palate", "Soft palate", "Multiple sites"]

# ─── Diagnosis Profiles ─────────────────────────────────────────────────────

DIAGNOSES = {
    "Aphthous Minor": {
        "risk_level": "LOW",
        "urgency": "ROUTINE",
        "weight": 300,  # how many cases to generate
    },
    "Aphthous Major": {
        "risk_level": "MODERATE",
        "urgency": "SOON",
        "weight": 150,
    },
    "Herpetiform Aphthous": {
        "risk_level": "LOW",
        "urgency": "SOON",
        "weight": 100,
    },
    "Traumatic Ulcer": {
        "risk_level": "LOW",
        "urgency": "ROUTINE",
        "weight": 350,
    },
    "Herpetic (HSV-1)": {
        "risk_level": "MODERATE",
        "urgency": "SOON",
        "weight": 150,
    },
    "Candidal Stomatitis": {
        "risk_level": "LOW",
        "urgency": "SOON",
        "weight": 120,
    },
    "Oral Lichen Planus": {
        "risk_level": "MODERATE",
        "urgency": "SOON",
        "weight": 120,
    },
    "Leukoplakia": {
        "risk_level": "HIGH",
        "urgency": "URGENT",
        "weight": 150,
    },
    "Erythroplakia": {
        "risk_level": "CRITICAL",
        "urgency": "URGENT",
        "weight": 100,
    },
    "Squamous Cell Carcinoma": {
        "risk_level": "CRITICAL",
        "urgency": "EMERGENCY",
        "weight": 200,
    },
    "Behcet's Disease": {
        "risk_level": "HIGH",
        "urgency": "URGENT",
        "weight": 80,
    },
    "Nutritional Deficiency Ulcer": {
        "risk_level": "LOW",
        "urgency": "SOON",
        "weight": 150,
    },
    "Drug-induced Ulcer": {
        "risk_level": "MODERATE",
        "urgency": "SOON",
        "weight": 100,
    },
}


def weighted_choice(options, weights):
    """Pick from options with given probability weights."""
    return random.choices(options, weights=weights, k=1)[0]


def yn(prob_yes):
    """Return True with probability prob_yes."""
    return random.random() < prob_yes


def generate_aphthous_minor():
    age = random.randint(10, 45)
    return {
        "age": age,
        "gender": random.choice(GENDERS),
        "tobaccoUse": weighted_choice(TOBACCO_OPTIONS, [70, 15, 10, 5]),
        "alcoholUse": weighted_choice(ALCOHOL_OPTIONS, [50, 30, 15, 5]),
        "betelNutUse": weighted_choice(BETEL_OPTIONS, [80, 10, 7, 3]),
        "diabetes": yn(0.08),
        "vitaminDeficiency": yn(0.25),
        "lowImmunity": yn(0.15),
        "currentMedications": "",
        "bitCheekLip": yn(0.05),
        "sharpToothRubbing": yn(0.05),
        "dentureContact": yn(0.02),
        "bracesIrritation": yn(0.05),
        "burnFromHotFood": yn(0.03),
        "chemicalContact": yn(0.01),
        "painWhileEating": yn(0.75),
        "soreRubbingTeeth": yn(0.20),
        "duration": weighted_choice(DURATION_OPTIONS, [15, 45, 30, 8, 2, 0]),
        "firstTimeOrRecurring": weighted_choice(RECURRENCE_OPTIONS, [25, 75]),
        "numberOfSores": weighted_choice(NUMBER_OPTIONS, [55, 35, 8, 2]),
        "size": weighted_choice(SIZE_OPTIONS, [60, 35, 5, 0]),
        "shape": weighted_choice(SHAPE_OPTIONS, [45, 45, 8, 2]),
        "color": weighted_choice(COLOR_OPTIONS, [20, 50, 5, 10, 15, 0]),
        "border": weighted_choice(BORDER_OPTIONS, [75, 15, 8, 2]),
        "bleedsEasily": yn(0.05),
        "soreLocation": weighted_choice(LOCATION_OPTIONS, [30, 15, 5, 20, 10, 2, 3, 2, 8, 5]),
        "alongBiteLine": yn(0.10),
        "painLevel": random.randint(3, 7),
        "difficultyEating": yn(0.55),
        "feverSwellingTiredness": yn(0.05),
        "lastingMoreThan2Weeks": yn(0.08),
        "gettingBigger": yn(0.05),
        "hardRaisedEdges": yn(0.02),
    }


def generate_aphthous_major():
    age = random.randint(15, 50)
    return {
        "age": age,
        "gender": random.choice(GENDERS),
        "tobaccoUse": weighted_choice(TOBACCO_OPTIONS, [65, 15, 15, 5]),
        "alcoholUse": weighted_choice(ALCOHOL_OPTIONS, [45, 30, 15, 10]),
        "betelNutUse": weighted_choice(BETEL_OPTIONS, [75, 12, 8, 5]),
        "diabetes": yn(0.12),
        "vitaminDeficiency": yn(0.30),
        "lowImmunity": yn(0.25),
        "currentMedications": "",
        "bitCheekLip": yn(0.05),
        "sharpToothRubbing": yn(0.05),
        "dentureContact": yn(0.03),
        "bracesIrritation": yn(0.03),
        "burnFromHotFood": yn(0.02),
        "chemicalContact": yn(0.01),
        "painWhileEating": yn(0.90),
        "soreRubbingTeeth": yn(0.30),
        "duration": weighted_choice(DURATION_OPTIONS, [2, 10, 25, 35, 25, 3]),
        "firstTimeOrRecurring": weighted_choice(RECURRENCE_OPTIONS, [20, 80]),
        "numberOfSores": weighted_choice(NUMBER_OPTIONS, [40, 40, 15, 5]),
        "size": weighted_choice(SIZE_OPTIONS, [5, 30, 50, 15]),
        "shape": weighted_choice(SHAPE_OPTIONS, [25, 35, 25, 15]),
        "color": weighted_choice(COLOR_OPTIONS, [15, 40, 10, 15, 15, 5]),
        "border": weighted_choice(BORDER_OPTIONS, [50, 30, 15, 5]),
        "bleedsEasily": yn(0.15),
        "soreLocation": weighted_choice(LOCATION_OPTIONS, [25, 20, 8, 15, 10, 3, 5, 3, 6, 5]),
        "alongBiteLine": yn(0.10),
        "painLevel": random.randint(5, 9),
        "difficultyEating": yn(0.85),
        "feverSwellingTiredness": yn(0.15),
        "lastingMoreThan2Weeks": yn(0.55),
        "gettingBigger": yn(0.20),
        "hardRaisedEdges": yn(0.05),
    }


def generate_herpetiform_aphthous():
    age = random.randint(20, 50)
    return {
        "age": age,
        "gender": weighted_choice(GENDERS, [30, 65, 5]),
        "tobaccoUse": weighted_choice(TOBACCO_OPTIONS, [70, 15, 10, 5]),
        "alcoholUse": weighted_choice(ALCOHOL_OPTIONS, [50, 30, 15, 5]),
        "betelNutUse": weighted_choice(BETEL_OPTIONS, [85, 8, 5, 2]),
        "diabetes": yn(0.08),
        "vitaminDeficiency": yn(0.20),
        "lowImmunity": yn(0.20),
        "currentMedications": "",
        "bitCheekLip": yn(0.03),
        "sharpToothRubbing": yn(0.03),
        "dentureContact": yn(0.02),
        "bracesIrritation": yn(0.02),
        "burnFromHotFood": yn(0.02),
        "chemicalContact": yn(0.01),
        "painWhileEating": yn(0.85),
        "soreRubbingTeeth": yn(0.25),
        "duration": weighted_choice(DURATION_OPTIONS, [10, 40, 35, 12, 3, 0]),
        "firstTimeOrRecurring": weighted_choice(RECURRENCE_OPTIONS, [15, 85]),
        "numberOfSores": weighted_choice(NUMBER_OPTIONS, [2, 10, 35, 53]),
        "size": weighted_choice(SIZE_OPTIONS, [85, 12, 3, 0]),
        "shape": weighted_choice(SHAPE_OPTIONS, [15, 15, 60, 10]),
        "color": weighted_choice(COLOR_OPTIONS, [25, 40, 10, 15, 10, 0]),
        "border": weighted_choice(BORDER_OPTIONS, [55, 15, 25, 5]),
        "bleedsEasily": yn(0.10),
        "soreLocation": weighted_choice(LOCATION_OPTIONS, [20, 15, 10, 15, 10, 5, 10, 3, 5, 7]),
        "alongBiteLine": yn(0.08),
        "painLevel": random.randint(4, 8),
        "difficultyEating": yn(0.80),
        "feverSwellingTiredness": yn(0.10),
        "lastingMoreThan2Weeks": yn(0.15),
        "gettingBigger": yn(0.10),
        "hardRaisedEdges": yn(0.02),
    }


def generate_traumatic_ulcer():
    age = random.randint(5, 80)
    has_denture = yn(0.25) if age > 40 else yn(0.02)
    has_braces = yn(0.35) if age < 25 else yn(0.03)
    return {
        "age": age,
        "gender": random.choice(GENDERS),
        "tobaccoUse": weighted_choice(TOBACCO_OPTIONS, [55, 20, 18, 7]),
        "alcoholUse": weighted_choice(ALCOHOL_OPTIONS, [50, 25, 15, 10]),
        "betelNutUse": weighted_choice(BETEL_OPTIONS, [70, 15, 10, 5]),
        "diabetes": yn(0.10),
        "vitaminDeficiency": yn(0.10),
        "lowImmunity": yn(0.08),
        "currentMedications": "",
        "bitCheekLip": yn(0.55),
        "sharpToothRubbing": yn(0.45),
        "dentureContact": has_denture,
        "bracesIrritation": has_braces,
        "burnFromHotFood": yn(0.20),
        "chemicalContact": yn(0.08),
        "painWhileEating": yn(0.65),
        "soreRubbingTeeth": yn(0.50),
        "duration": weighted_choice(DURATION_OPTIONS, [25, 40, 25, 8, 2, 0]),
        "firstTimeOrRecurring": weighted_choice(RECURRENCE_OPTIONS, [55, 45]),
        "numberOfSores": weighted_choice(NUMBER_OPTIONS, [70, 22, 6, 2]),
        "size": weighted_choice(SIZE_OPTIONS, [35, 45, 15, 5]),
        "shape": weighted_choice(SHAPE_OPTIONS, [20, 25, 45, 10]),
        "color": weighted_choice(COLOR_OPTIONS, [15, 30, 10, 35, 8, 2]),
        "border": weighted_choice(BORDER_OPTIONS, [60, 15, 20, 5]),
        "bleedsEasily": yn(0.12),
        "soreLocation": weighted_choice(LOCATION_OPTIONS, [35, 20, 8, 15, 5, 5, 3, 2, 3, 4]),
        "alongBiteLine": yn(0.55),
        "painLevel": random.randint(2, 7),
        "difficultyEating": yn(0.50),
        "feverSwellingTiredness": yn(0.05),
        "lastingMoreThan2Weeks": yn(0.12),
        "gettingBigger": yn(0.08),
        "hardRaisedEdges": yn(0.03),
    }


def generate_herpetic():
    age = random.randint(5, 60)
    return {
        "age": age,
        "gender": random.choice(GENDERS),
        "tobaccoUse": weighted_choice(TOBACCO_OPTIONS, [60, 20, 12, 8]),
        "alcoholUse": weighted_choice(ALCOHOL_OPTIONS, [50, 30, 12, 8]),
        "betelNutUse": weighted_choice(BETEL_OPTIONS, [80, 10, 7, 3]),
        "diabetes": yn(0.08),
        "vitaminDeficiency": yn(0.10),
        "lowImmunity": yn(0.30),
        "currentMedications": "",
        "bitCheekLip": yn(0.05),
        "sharpToothRubbing": yn(0.03),
        "dentureContact": yn(0.02),
        "bracesIrritation": yn(0.02),
        "burnFromHotFood": yn(0.02),
        "chemicalContact": yn(0.01),
        "painWhileEating": yn(0.80),
        "soreRubbingTeeth": yn(0.15),
        "duration": weighted_choice(DURATION_OPTIONS, [15, 50, 30, 5, 0, 0]),
        "firstTimeOrRecurring": weighted_choice(RECURRENCE_OPTIONS, [35, 65]),
        "numberOfSores": weighted_choice(NUMBER_OPTIONS, [8, 25, 35, 32]),
        "size": weighted_choice(SIZE_OPTIONS, [75, 20, 5, 0]),
        "shape": weighted_choice(SHAPE_OPTIONS, [30, 20, 40, 10]),
        "color": weighted_choice(COLOR_OPTIONS, [15, 25, 30, 10, 15, 5]),
        "border": weighted_choice(BORDER_OPTIONS, [45, 20, 30, 5]),
        "bleedsEasily": yn(0.15),
        "soreLocation": weighted_choice(LOCATION_OPTIONS, [10, 5, 5, 10, 10, 25, 3, 20, 5, 7]),
        "alongBiteLine": yn(0.05),
        "painLevel": random.randint(5, 9),
        "difficultyEating": yn(0.75),
        "feverSwellingTiredness": yn(0.65),
        "lastingMoreThan2Weeks": yn(0.10),
        "gettingBigger": yn(0.08),
        "hardRaisedEdges": yn(0.03),
    }


def generate_candidal():
    age = random.randint(25, 80)
    return {
        "age": age,
        "gender": random.choice(GENDERS),
        "tobaccoUse": weighted_choice(TOBACCO_OPTIONS, [50, 20, 20, 10]),
        "alcoholUse": weighted_choice(ALCOHOL_OPTIONS, [45, 25, 18, 12]),
        "betelNutUse": weighted_choice(BETEL_OPTIONS, [65, 15, 12, 8]),
        "diabetes": yn(0.35),
        "vitaminDeficiency": yn(0.15),
        "lowImmunity": yn(0.40),
        "currentMedications": weighted_choice(["antibiotics", "steroids", "immunosuppressants", ""], [30, 25, 15, 30]),
        "bitCheekLip": yn(0.03),
        "sharpToothRubbing": yn(0.05),
        "dentureContact": yn(0.40),
        "bracesIrritation": yn(0.02),
        "burnFromHotFood": yn(0.03),
        "chemicalContact": yn(0.02),
        "painWhileEating": yn(0.45),
        "soreRubbingTeeth": yn(0.15),
        "duration": weighted_choice(DURATION_OPTIONS, [5, 15, 25, 30, 20, 5]),
        "firstTimeOrRecurring": weighted_choice(RECURRENCE_OPTIONS, [30, 70]),
        "numberOfSores": weighted_choice(NUMBER_OPTIONS, [20, 30, 25, 25]),
        "size": weighted_choice(SIZE_OPTIONS, [20, 35, 30, 15]),
        "shape": weighted_choice(SHAPE_OPTIONS, [15, 15, 55, 15]),
        "color": weighted_choice(COLOR_OPTIONS, [55, 15, 10, 5, 5, 10]),
        "border": weighted_choice(BORDER_OPTIONS, [40, 20, 35, 5]),
        "bleedsEasily": yn(0.08),
        "soreLocation": weighted_choice(LOCATION_OPTIONS, [20, 20, 15, 5, 5, 5, 5, 15, 5, 5]),
        "alongBiteLine": yn(0.05),
        "painLevel": random.randint(1, 5),
        "difficultyEating": yn(0.40),
        "feverSwellingTiredness": yn(0.10),
        "lastingMoreThan2Weeks": yn(0.45),
        "gettingBigger": yn(0.15),
        "hardRaisedEdges": yn(0.03),
    }


def generate_lichen_planus():
    age = random.randint(30, 70)
    return {
        "age": age,
        "gender": weighted_choice(GENDERS, [30, 65, 5]),
        "tobaccoUse": weighted_choice(TOBACCO_OPTIONS, [60, 18, 15, 7]),
        "alcoholUse": weighted_choice(ALCOHOL_OPTIONS, [50, 25, 15, 10]),
        "betelNutUse": weighted_choice(BETEL_OPTIONS, [75, 12, 8, 5]),
        "diabetes": yn(0.15),
        "vitaminDeficiency": yn(0.12),
        "lowImmunity": yn(0.25),
        "currentMedications": "",
        "bitCheekLip": yn(0.05),
        "sharpToothRubbing": yn(0.08),
        "dentureContact": yn(0.08),
        "bracesIrritation": yn(0.02),
        "burnFromHotFood": yn(0.03),
        "chemicalContact": yn(0.02),
        "painWhileEating": yn(0.60),
        "soreRubbingTeeth": yn(0.20),
        "duration": weighted_choice(DURATION_OPTIONS, [2, 5, 15, 25, 35, 18]),
        "firstTimeOrRecurring": weighted_choice(RECURRENCE_OPTIONS, [20, 80]),
        "numberOfSores": weighted_choice(NUMBER_OPTIONS, [15, 35, 30, 20]),
        "size": weighted_choice(SIZE_OPTIONS, [15, 40, 35, 10]),
        "shape": weighted_choice(SHAPE_OPTIONS, [10, 15, 60, 15]),
        "color": weighted_choice(COLOR_OPTIONS, [30, 20, 15, 10, 5, 20]),
        "border": weighted_choice(BORDER_OPTIONS, [30, 25, 35, 10]),
        "bleedsEasily": yn(0.15),
        "soreLocation": weighted_choice(LOCATION_OPTIONS, [40, 10, 8, 5, 5, 8, 3, 3, 3, 15]),
        "alongBiteLine": yn(0.15),
        "painLevel": random.randint(2, 7),
        "difficultyEating": yn(0.55),
        "feverSwellingTiredness": yn(0.08),
        "lastingMoreThan2Weeks": yn(0.65),
        "gettingBigger": yn(0.15),
        "hardRaisedEdges": yn(0.08),
    }


def generate_leukoplakia():
    age = random.randint(40, 80)
    return {
        "age": age,
        "gender": weighted_choice(GENDERS, [70, 28, 2]),
        "tobaccoUse": weighted_choice(TOBACCO_OPTIONS, [8, 15, 65, 12]),
        "alcoholUse": weighted_choice(ALCOHOL_OPTIONS, [20, 25, 30, 25]),
        "betelNutUse": weighted_choice(BETEL_OPTIONS, [25, 20, 35, 20]),
        "diabetes": yn(0.12),
        "vitaminDeficiency": yn(0.10),
        "lowImmunity": yn(0.10),
        "currentMedications": "",
        "bitCheekLip": yn(0.05),
        "sharpToothRubbing": yn(0.10),
        "dentureContact": yn(0.12),
        "bracesIrritation": yn(0.01),
        "burnFromHotFood": yn(0.03),
        "chemicalContact": yn(0.05),
        "painWhileEating": yn(0.20),
        "soreRubbingTeeth": yn(0.15),
        "duration": weighted_choice(DURATION_OPTIONS, [0, 2, 5, 15, 40, 38]),
        "firstTimeOrRecurring": weighted_choice(RECURRENCE_OPTIONS, [60, 40]),
        "numberOfSores": weighted_choice(NUMBER_OPTIONS, [65, 25, 8, 2]),
        "size": weighted_choice(SIZE_OPTIONS, [10, 30, 40, 20]),
        "shape": weighted_choice(SHAPE_OPTIONS, [10, 15, 60, 15]),
        "color": weighted_choice(COLOR_OPTIONS, [55, 15, 3, 15, 2, 10]),
        "border": weighted_choice(BORDER_OPTIONS, [20, 35, 35, 10]),
        "bleedsEasily": yn(0.08),
        "soreLocation": weighted_choice(LOCATION_OPTIONS, [30, 25, 10, 8, 5, 5, 10, 3, 2, 2]),
        "alongBiteLine": yn(0.15),
        "painLevel": random.randint(0, 3),
        "difficultyEating": yn(0.15),
        "feverSwellingTiredness": yn(0.03),
        "lastingMoreThan2Weeks": yn(0.85),
        "gettingBigger": yn(0.30),
        "hardRaisedEdges": yn(0.20),
    }


def generate_erythroplakia():
    age = random.randint(45, 80)
    return {
        "age": age,
        "gender": weighted_choice(GENDERS, [65, 33, 2]),
        "tobaccoUse": weighted_choice(TOBACCO_OPTIONS, [5, 12, 70, 13]),
        "alcoholUse": weighted_choice(ALCOHOL_OPTIONS, [12, 20, 35, 33]),
        "betelNutUse": weighted_choice(BETEL_OPTIONS, [20, 18, 40, 22]),
        "diabetes": yn(0.10),
        "vitaminDeficiency": yn(0.08),
        "lowImmunity": yn(0.10),
        "currentMedications": "",
        "bitCheekLip": yn(0.03),
        "sharpToothRubbing": yn(0.05),
        "dentureContact": yn(0.08),
        "bracesIrritation": yn(0.01),
        "burnFromHotFood": yn(0.02),
        "chemicalContact": yn(0.03),
        "painWhileEating": yn(0.25),
        "soreRubbingTeeth": yn(0.10),
        "duration": weighted_choice(DURATION_OPTIONS, [0, 2, 5, 15, 40, 38]),
        "firstTimeOrRecurring": weighted_choice(RECURRENCE_OPTIONS, [65, 35]),
        "numberOfSores": weighted_choice(NUMBER_OPTIONS, [70, 22, 6, 2]),
        "size": weighted_choice(SIZE_OPTIONS, [8, 30, 40, 22]),
        "shape": weighted_choice(SHAPE_OPTIONS, [8, 12, 65, 15]),
        "color": weighted_choice(COLOR_OPTIONS, [3, 5, 65, 5, 2, 20]),
        "border": weighted_choice(BORDER_OPTIONS, [15, 35, 35, 15]),
        "bleedsEasily": yn(0.25),
        "soreLocation": weighted_choice(LOCATION_OPTIONS, [20, 25, 10, 10, 5, 5, 15, 5, 3, 2]),
        "alongBiteLine": yn(0.08),
        "painLevel": random.randint(0, 4),
        "difficultyEating": yn(0.20),
        "feverSwellingTiredness": yn(0.05),
        "lastingMoreThan2Weeks": yn(0.90),
        "gettingBigger": yn(0.40),
        "hardRaisedEdges": yn(0.30),
    }


def generate_scc():
    age = random.randint(45, 85)
    return {
        "age": age,
        "gender": weighted_choice(GENDERS, [72, 26, 2]),
        "tobaccoUse": weighted_choice(TOBACCO_OPTIONS, [5, 10, 70, 15]),
        "alcoholUse": weighted_choice(ALCOHOL_OPTIONS, [8, 15, 35, 42]),
        "betelNutUse": weighted_choice(BETEL_OPTIONS, [15, 15, 40, 30]),
        "diabetes": yn(0.12),
        "vitaminDeficiency": yn(0.08),
        "lowImmunity": yn(0.15),
        "currentMedications": "",
        "bitCheekLip": yn(0.03),
        "sharpToothRubbing": yn(0.08),
        "dentureContact": yn(0.12),
        "bracesIrritation": yn(0.01),
        "burnFromHotFood": yn(0.02),
        "chemicalContact": yn(0.05),
        "painWhileEating": yn(0.35),
        "soreRubbingTeeth": yn(0.12),
        "duration": weighted_choice(DURATION_OPTIONS, [0, 0, 3, 10, 35, 52]),
        "firstTimeOrRecurring": weighted_choice(RECURRENCE_OPTIONS, [75, 25]),
        "numberOfSores": weighted_choice(NUMBER_OPTIONS, [80, 15, 4, 1]),
        "size": weighted_choice(SIZE_OPTIONS, [3, 15, 40, 42]),
        "shape": weighted_choice(SHAPE_OPTIONS, [5, 8, 50, 37]),
        "color": weighted_choice(COLOR_OPTIONS, [12, 10, 25, 15, 3, 35]),
        "border": weighted_choice(BORDER_OPTIONS, [5, 20, 25, 50]),
        "bleedsEasily": yn(0.60),
        "soreLocation": weighted_choice(LOCATION_OPTIONS, [15, 35, 8, 10, 5, 5, 15, 3, 2, 2]),
        "alongBiteLine": yn(0.10),
        "painLevel": random.randint(0, 5),
        "difficultyEating": yn(0.40),
        "feverSwellingTiredness": yn(0.20),
        "lastingMoreThan2Weeks": yn(0.95),
        "gettingBigger": yn(0.80),
        "hardRaisedEdges": yn(0.75),
    }


def generate_behcets():
    age = random.randint(18, 45)
    return {
        "age": age,
        "gender": random.choice(GENDERS),
        "tobaccoUse": weighted_choice(TOBACCO_OPTIONS, [65, 18, 12, 5]),
        "alcoholUse": weighted_choice(ALCOHOL_OPTIONS, [55, 25, 12, 8]),
        "betelNutUse": weighted_choice(BETEL_OPTIONS, [80, 10, 7, 3]),
        "diabetes": yn(0.06),
        "vitaminDeficiency": yn(0.12),
        "lowImmunity": yn(0.35),
        "currentMedications": weighted_choice(["immunosuppressants", "steroids", ""], [20, 20, 60]),
        "bitCheekLip": yn(0.05),
        "sharpToothRubbing": yn(0.03),
        "dentureContact": yn(0.02),
        "bracesIrritation": yn(0.02),
        "burnFromHotFood": yn(0.02),
        "chemicalContact": yn(0.01),
        "painWhileEating": yn(0.85),
        "soreRubbingTeeth": yn(0.20),
        "duration": weighted_choice(DURATION_OPTIONS, [5, 20, 35, 25, 12, 3]),
        "firstTimeOrRecurring": weighted_choice(RECURRENCE_OPTIONS, [10, 90]),
        "numberOfSores": weighted_choice(NUMBER_OPTIONS, [10, 35, 35, 20]),
        "size": weighted_choice(SIZE_OPTIONS, [20, 40, 30, 10]),
        "shape": weighted_choice(SHAPE_OPTIONS, [30, 30, 30, 10]),
        "color": weighted_choice(COLOR_OPTIONS, [15, 35, 15, 15, 15, 5]),
        "border": weighted_choice(BORDER_OPTIONS, [40, 25, 30, 5]),
        "bleedsEasily": yn(0.15),
        "soreLocation": weighted_choice(LOCATION_OPTIONS, [20, 15, 10, 10, 10, 5, 5, 5, 5, 15]),
        "alongBiteLine": yn(0.05),
        "painLevel": random.randint(5, 9),
        "difficultyEating": yn(0.80),
        "feverSwellingTiredness": yn(0.70),
        "lastingMoreThan2Weeks": yn(0.40),
        "gettingBigger": yn(0.15),
        "hardRaisedEdges": yn(0.05),
    }


def generate_nutritional_deficiency():
    age = random.randint(15, 70)
    return {
        "age": age,
        "gender": weighted_choice(GENDERS, [35, 60, 5]),
        "tobaccoUse": weighted_choice(TOBACCO_OPTIONS, [60, 20, 12, 8]),
        "alcoholUse": weighted_choice(ALCOHOL_OPTIONS, [40, 25, 20, 15]),
        "betelNutUse": weighted_choice(BETEL_OPTIONS, [70, 15, 10, 5]),
        "diabetes": yn(0.10),
        "vitaminDeficiency": yn(0.85),
        "lowImmunity": yn(0.30),
        "currentMedications": "",
        "bitCheekLip": yn(0.05),
        "sharpToothRubbing": yn(0.05),
        "dentureContact": yn(0.05),
        "bracesIrritation": yn(0.02),
        "burnFromHotFood": yn(0.03),
        "chemicalContact": yn(0.01),
        "painWhileEating": yn(0.60),
        "soreRubbingTeeth": yn(0.15),
        "duration": weighted_choice(DURATION_OPTIONS, [3, 10, 20, 30, 25, 12]),
        "firstTimeOrRecurring": weighted_choice(RECURRENCE_OPTIONS, [25, 75]),
        "numberOfSores": weighted_choice(NUMBER_OPTIONS, [20, 40, 25, 15]),
        "size": weighted_choice(SIZE_OPTIONS, [45, 40, 12, 3]),
        "shape": weighted_choice(SHAPE_OPTIONS, [30, 35, 25, 10]),
        "color": weighted_choice(COLOR_OPTIONS, [15, 30, 25, 10, 15, 5]),
        "border": weighted_choice(BORDER_OPTIONS, [50, 20, 25, 5]),
        "bleedsEasily": yn(0.15),
        "soreLocation": weighted_choice(LOCATION_OPTIONS, [15, 20, 25, 10, 5, 5, 5, 3, 3, 9]),
        "alongBiteLine": yn(0.05),
        "painLevel": random.randint(2, 6),
        "difficultyEating": yn(0.55),
        "feverSwellingTiredness": yn(0.35),
        "lastingMoreThan2Weeks": yn(0.45),
        "gettingBigger": yn(0.10),
        "hardRaisedEdges": yn(0.03),
    }


def generate_drug_induced():
    age = random.randint(20, 75)
    meds = weighted_choice(
        ["NSAIDs", "methotrexate", "chemotherapy", "antibiotics", "anticonvulsants", "bisphosphonates"],
        [25, 20, 15, 15, 15, 10]
    )
    return {
        "age": age,
        "gender": random.choice(GENDERS),
        "tobaccoUse": weighted_choice(TOBACCO_OPTIONS, [55, 20, 15, 10]),
        "alcoholUse": weighted_choice(ALCOHOL_OPTIONS, [45, 25, 18, 12]),
        "betelNutUse": weighted_choice(BETEL_OPTIONS, [75, 12, 8, 5]),
        "diabetes": yn(0.12),
        "vitaminDeficiency": yn(0.10),
        "lowImmunity": yn(0.25),
        "currentMedications": meds,
        "bitCheekLip": yn(0.03),
        "sharpToothRubbing": yn(0.03),
        "dentureContact": yn(0.05),
        "bracesIrritation": yn(0.02),
        "burnFromHotFood": yn(0.02),
        "chemicalContact": yn(0.03),
        "painWhileEating": yn(0.55),
        "soreRubbingTeeth": yn(0.12),
        "duration": weighted_choice(DURATION_OPTIONS, [5, 15, 30, 30, 15, 5]),
        "firstTimeOrRecurring": weighted_choice(RECURRENCE_OPTIONS, [45, 55]),
        "numberOfSores": weighted_choice(NUMBER_OPTIONS, [30, 35, 25, 10]),
        "size": weighted_choice(SIZE_OPTIONS, [25, 40, 25, 10]),
        "shape": weighted_choice(SHAPE_OPTIONS, [20, 25, 40, 15]),
        "color": weighted_choice(COLOR_OPTIONS, [20, 25, 20, 15, 10, 10]),
        "border": weighted_choice(BORDER_OPTIONS, [35, 25, 30, 10]),
        "bleedsEasily": yn(0.12),
        "soreLocation": weighted_choice(LOCATION_OPTIONS, [20, 15, 15, 10, 10, 8, 5, 5, 5, 7]),
        "alongBiteLine": yn(0.05),
        "painLevel": random.randint(2, 7),
        "difficultyEating": yn(0.50),
        "feverSwellingTiredness": yn(0.15),
        "lastingMoreThan2Weeks": yn(0.35),
        "gettingBigger": yn(0.10),
        "hardRaisedEdges": yn(0.05),
    }


# ─── Generator Map ──────────────────────────────────────────────────────────

GENERATORS = {
    "Aphthous Minor": generate_aphthous_minor,
    "Aphthous Major": generate_aphthous_major,
    "Herpetiform Aphthous": generate_herpetiform_aphthous,
    "Traumatic Ulcer": generate_traumatic_ulcer,
    "Herpetic (HSV-1)": generate_herpetic,
    "Candidal Stomatitis": generate_candidal,
    "Oral Lichen Planus": generate_lichen_planus,
    "Leukoplakia": generate_leukoplakia,
    "Erythroplakia": generate_erythroplakia,
    "Squamous Cell Carcinoma": generate_scc,
    "Behcet's Disease": generate_behcets,
    "Nutritional Deficiency Ulcer": generate_nutritional_deficiency,
    "Drug-induced Ulcer": generate_drug_induced,
}


# ─── CSV Field Order ─────────────────────────────────────────────────────────

FIELDS = [
    "age", "gender",
    "tobaccoUse", "alcoholUse", "betelNutUse",
    "diabetes", "vitaminDeficiency", "lowImmunity", "currentMedications",
    "bitCheekLip", "sharpToothRubbing", "dentureContact", "bracesIrritation",
    "burnFromHotFood", "chemicalContact", "painWhileEating", "soreRubbingTeeth",
    "duration", "firstTimeOrRecurring", "numberOfSores",
    "size", "shape", "color", "border", "bleedsEasily",
    "soreLocation", "alongBiteLine",
    "painLevel", "difficultyEating", "feverSwellingTiredness",
    "lastingMoreThan2Weeks", "gettingBigger", "hardRaisedEdges",
    # Labels
    "diagnosis", "risk_level", "urgency",
]


def generate_dataset():
    rows = []
    for diagnosis_name, config in DIAGNOSES.items():
        generator = GENERATORS[diagnosis_name]
        count = config["weight"]

        for _ in range(count):
            case = generator()
            case["diagnosis"] = diagnosis_name
            case["risk_level"] = config["risk_level"]
            case["urgency"] = config["urgency"]

            # Convert booleans to 0/1 for CSV
            for key in case:
                if isinstance(case[key], bool):
                    case[key] = 1 if case[key] else 0

            rows.append(case)

    # Shuffle
    random.shuffle(rows)

    # Write CSV
    with open(OUTPUT_FILE, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=FIELDS)
        writer.writeheader()
        writer.writerows(rows)

    print(f"[OK] Generated {len(rows)} cases across {len(DIAGNOSES)} diagnoses")
    print(f"[FILE] Saved to: {OUTPUT_FILE}")

    # Print distribution
    from collections import Counter
    dist = Counter(r["diagnosis"] for r in rows)
    print("\n[STATS] Distribution:")
    for d, c in sorted(dist.items(), key=lambda x: -x[1]):
        print(f"  {d:35s} {c:4d} cases ({c/len(rows)*100:.1f}%)")


if __name__ == "__main__":
    generate_dataset()
