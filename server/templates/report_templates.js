/**
 * Oral Ulcer Diagnosis Report Templates
 * ======================================
 * Generates structured 8-section reports from model predictions.
 * Each diagnosis has pre-written clinical content.
 */

const DIAGNOSIS_TEMPLATES = {
  "Aphthous Minor": {
    explanation: "Minor aphthous ulcers are the most common type of canker sore. They are small, round/oval, shallow ulcers with a white-yellow center and red border. They typically heal within 1-2 weeks without scarring.",
    differentials: [
      "Traumatic Ulcer - would show clear trauma history and location along bite line",
      "Herpetic Ulcer (HSV-1) - usually appears on keratinized tissue (gums, palate) with clustered vesicles and fever",
      "Nutritional Deficiency Ulcer - would present with glossitis and systemic signs of anemia"
    ],
    redFlagChecks: ["Duration exceeding 3 weeks", "Rapid enlargement", "Hard or rolled edges"],
    actions: [
      "Apply topical antiseptic gel (e.g., Orajel, benzocaine) for pain relief",
      "Rinse with warm salt water (1/2 teaspoon salt in 8 oz water) 3-4 times daily",
      "Avoid spicy, acidic, or abrasive foods until healed",
      "If not healed in 2 weeks, schedule an appointment with a Dentist"
    ],
  },

  "Aphthous Major": {
    explanation: "Major aphthous ulcers are larger (>10mm), deeper, and more painful than minor aphthous. They can take weeks to months to heal and may leave scarring. They require closer monitoring and often medical intervention.",
    differentials: [
      "Squamous Cell Carcinoma - distinguished by hard/rolled edges, progressive growth, and tobacco/alcohol history",
      "Behcet's Disease - presents with recurrent oral and genital ulcers plus systemic symptoms",
      "Traumatic Ulcer - would have clear precipitating trauma and heal once cause is removed"
    ],
    redFlagChecks: ["Ulcer persisting beyond 4 weeks", "Induration or hardening", "Unilateral lymphadenopathy"],
    actions: [
      "Consult a Dentist or Oral Medicine specialist within 1 week",
      "Prescription topical corticosteroid (e.g., triamcinolone acetonide) may be needed",
      "Maintain soft diet and good oral hygiene",
      "Monitor for signs of secondary infection (increased swelling, pus, fever)"
    ],
  },

  "Herpetiform Aphthous": {
    explanation: "Herpetiform aphthous ulcers present as clusters of many tiny (1-3mm) ulcers that may merge into larger irregular areas. Despite the name, they are not caused by herpes virus. More common in women and tend to recur frequently.",
    differentials: [
      "Herpetic Stomatitis (HSV-1) - involves keratinized mucosa, has vesicle stage, and is contagious",
      "Erythema Multiforme - presents with target lesions on skin and crusted lip lesions",
      "Aphthous Minor - fewer, larger, isolated ulcers"
    ],
    redFlagChecks: ["Fever with ulcers (suggests viral cause)", "Skin lesions", "Eye involvement"],
    actions: [
      "Use chlorhexidine mouthwash for pain relief and infection prevention",
      "Over-the-counter topical anesthetic for symptom management",
      "Consult a Dentist if episodes are frequent (>3 per year) for preventive treatment",
      "Vitamin B12 and folate supplementation may help prevent recurrence"
    ],
  },

  "Traumatic Ulcer": {
    explanation: "Traumatic ulcers result from physical injury to the oral mucosa. Common causes include cheek/lip biting, sharp tooth edges, ill-fitting dentures, orthodontic appliances, or thermal burns. They heal once the traumatic cause is identified and removed.",
    differentials: [
      "Aphthous Minor - lacks trauma history, often recurrent, and found on non-keratinized mucosa",
      "Squamous Cell Carcinoma - non-healing ulcer with induration; must be ruled out if ulcer persists >2 weeks",
      "Eosinophilic Ulcer - rare, indolent, may mimic malignancy"
    ],
    redFlagChecks: ["Persistence beyond 2 weeks after removing cause", "Development of hard edges", "Growth despite treatment"],
    actions: [
      "Identify and eliminate the traumatic cause (smooth sharp tooth, adjust denture, use dental wax on braces)",
      "Rinse with warm salt water to promote healing",
      "If caused by a sharp tooth, visit a Dentist for smoothing or restoration",
      "If not healed in 10-14 days after removing cause, seek biopsy referral"
    ],
  },

  "Herpetic (HSV-1)": {
    explanation: "Primary or recurrent herpes simplex virus type 1 infection of the oral cavity. Presents as clusters of small vesicles that rupture into painful ulcers, typically on keratinized mucosa (gums, hard palate, lips). Often accompanied by fever and malaise.",
    differentials: [
      "Herpetiform Aphthous - affects non-keratinized mucosa, no vesicle stage, no contagion",
      "Hand-Foot-Mouth Disease - also presents with vesicles but affects palms and soles",
      "Erythema Multiforme - target lesions on skin, hemorrhagic crusting of lips"
    ],
    redFlagChecks: ["Immunocompromised status", "Disseminated lesions", "Ocular involvement"],
    actions: [
      "Start antiviral medication (acyclovir/valacyclovir) within 72 hours of symptom onset for best effect",
      "Maintain hydration and soft diet",
      "Avoid close contact and sharing utensils (HSV is contagious during active lesions)",
      "Consult a physician or Dentist for prescription antivirals, especially for recurrent episodes"
    ],
  },

  "Candidal Stomatitis": {
    explanation: "Oral candidiasis (thrush) is a fungal infection caused by Candida species, most commonly C. albicans. It presents as white patches that can be wiped off, leaving a red base. Common in denture wearers, diabetics, and immunocompromised patients.",
    differentials: [
      "Leukoplakia - white patches that cannot be scraped off",
      "Oral Lichen Planus - bilateral white lacy streaks (Wickham striae)",
      "Chemical Burn - acute onset with known chemical exposure"
    ],
    redFlagChecks: ["Immunocompromised status", "Dysphagia suggesting esophageal spread", "Recurrence despite treatment"],
    actions: [
      "Antifungal treatment: topical nystatin rinse or clotrimazole troches",
      "If wearing dentures, clean thoroughly and remove at night; consider denture disinfection",
      "Control underlying risk factors (blood sugar management for diabetics)",
      "Consult a Dentist or physician if not resolved in 2 weeks of antifungal therapy"
    ],
  },

  "Oral Lichen Planus": {
    explanation: "Oral lichen planus is a chronic inflammatory autoimmune condition. It presents as white lacy lines (Wickham striae), red patches, or erosive ulcers. Most commonly affects the inside of both cheeks (bilateral). More common in middle-aged women.",
    differentials: [
      "Leukoplakia - unilateral white patch, strong tobacco association, pre-malignant",
      "Lichenoid Drug Reaction - similar appearance but related to medication (e.g., NSAIDs, antihypertensives)",
      "Lupus Erythematosus - similar oral features but with systemic symptoms"
    ],
    redFlagChecks: ["Erosive form has ~1% malignant transformation risk", "Rapid change in character", "New nodularity"],
    actions: [
      "Consult an Oral Medicine specialist for definitive diagnosis (biopsy may be needed)",
      "Topical corticosteroid therapy for symptomatic erosive lesions",
      "Avoid irritants (spicy food, alcohol-based mouthwash)",
      "Long-term monitoring every 6-12 months due to low malignant transformation risk"
    ],
  },

  "Leukoplakia": {
    explanation: "Leukoplakia is a potentially pre-malignant white patch or plaque that cannot be characterized as any other condition. Strongly associated with tobacco use and betel nut chewing. Requires biopsy to assess for dysplasia.",
    differentials: [
      "Oral Lichen Planus - bilateral, lacy white pattern, typically inside cheeks",
      "Candidal Stomatitis - white patches that can be scraped off",
      "Frictional Keratosis - white patch at site of chronic friction, resolves when irritant removed"
    ],
    redFlagChecks: ["Non-homogeneous (speckled) leukoplakia has higher malignant risk", "Floor of mouth or ventral tongue location", "Any red component (erythroleukoplakia)"],
    actions: [
      "URGENT: Refer to Oral Surgeon or ENT for clinical evaluation and biopsy",
      "Complete cessation of tobacco, betel nut, and alcohol",
      "Biopsy is mandatory to rule out dysplasia or early carcinoma",
      "Follow-up every 3-6 months with clinical and photographic documentation"
    ],
  },

  "Erythroplakia": {
    explanation: "Erythroplakia is a red velvety patch of the oral mucosa that cannot be attributed to any other condition. It carries the highest malignant transformation rate of any oral pre-malignant lesion (up to 50% show dysplasia or carcinoma on biopsy).",
    differentials: [
      "Squamous Cell Carcinoma - may already be present within the lesion",
      "Erosive Lichen Planus - bilateral, with white streaks at periphery",
      "Candidal Erythematous - responds to antifungal therapy"
    ],
    redFlagChecks: ["ALL erythroplakia is a red flag and requires urgent biopsy", "Any induration or fixation", "Regional lymphadenopathy"],
    actions: [
      "EMERGENCY: Immediate referral to Oral Surgeon or Head & Neck Oncologist",
      "Incisional biopsy is mandatory - do not delay",
      "Complete cessation of all tobacco and alcohol products",
      "Prepare for potential surgical excision based on biopsy results"
    ],
  },

  "Squamous Cell Carcinoma": {
    explanation: "Oral squamous cell carcinoma (OSCC) is a malignant tumor. It typically presents as a non-healing ulcer with hard, raised, or rolled edges that progressively grows. Major risk factors include tobacco use, heavy alcohol consumption, betel nut chewing, and HPV infection. Early detection significantly improves prognosis.",
    differentials: [
      "Traumatic Ulcer - heals within 2 weeks when cause removed, no induration",
      "Major Aphthous Ulcer - very painful, recurrent history, no induration",
      "Necrotizing Sialometaplasia - palatal ulcer that mimics malignancy but is self-limiting"
    ],
    redFlagChecks: ["Non-healing ulcer >2 weeks with induration", "Progressive growth", "Hard rolled edges", "Bleeding on touch", "Lymphadenopathy", "Weight loss", "Fixation to underlying structures"],
    actions: [
      "EMERGENCY: Immediate referral to Head & Neck Oncologist or Oral & Maxillofacial Surgeon",
      "Urgent incisional biopsy for histopathological confirmation",
      "CT/MRI imaging for staging if malignancy confirmed",
      "Do NOT delay - early-stage OSCC has significantly better 5-year survival rates",
      "Multidisciplinary team approach: Surgery, Radiation Oncology, Medical Oncology"
    ],
  },

  "Behcet's Disease": {
    explanation: "Behcet's disease is a chronic systemic vasculitis characterized by recurrent oral ulcers, genital ulcers, and ocular inflammation. Oral ulcers are often the first and most common manifestation. They are painful, multiple, and recurrent.",
    differentials: [
      "Recurrent Aphthous Stomatitis - oral ulcers only, no genital or eye involvement",
      "Inflammatory Bowel Disease - may have oral ulcers but with GI symptoms",
      "Reactive Arthritis - oral ulcers with urethritis and conjunctivitis"
    ],
    redFlagChecks: ["Genital ulcers", "Eye inflammation (uveitis)", "Skin lesions (erythema nodosum)", "Joint pain", "Neurological symptoms"],
    actions: [
      "Refer to Rheumatologist for systemic evaluation and management",
      "Ophthalmology referral for eye examination (uveitis can cause blindness)",
      "Systemic immunosuppressive therapy may be required (colchicine, azathioprine)",
      "Topical corticosteroids for oral ulcer symptom management"
    ],
  },

  "Nutritional Deficiency Ulcer": {
    explanation: "Oral ulcers associated with nutritional deficiencies, particularly iron, vitamin B12, and folate. The oral mucosa is highly sensitive to nutritional status. Deficiency causes thinning of the mucosa, making it prone to ulceration. Often accompanied by glossitis (smooth, red tongue) and angular cheilitis.",
    differentials: [
      "Aphthous Minor - not associated with glossitis or systemic deficiency signs",
      "Oral Lichen Planus - white lacy pattern, autoimmune mechanism",
      "Drug-induced Ulcer - temporal relationship with medication"
    ],
    redFlagChecks: ["Severe anemia symptoms (fatigue, pallor, tachycardia)", "Neurological symptoms from B12 deficiency", "Unexplained weight loss (consider malabsorption)"],
    actions: [
      "Blood tests: Complete blood count, serum iron, ferritin, vitamin B12, and folate levels",
      "Start supplementation based on identified deficiency (iron, B12, folate)",
      "Dietary counseling to increase intake of leafy greens, meats, and fortified foods",
      "Follow up with physician in 4-6 weeks to reassess blood levels and ulcer healing"
    ],
  },

  "Drug-induced Ulcer": {
    explanation: "Oral ulcers caused by adverse drug reactions. Common culprits include NSAIDs, methotrexate, chemotherapy agents, anticonvulsants, and bisphosphonates. The temporal relationship between starting the medication and ulcer onset is the key diagnostic clue.",
    differentials: [
      "Aphthous Minor - no medication temporal relationship",
      "Lichenoid Drug Reaction - white/red patches rather than ulcers",
      "Neutropenic Ulcer - from chemotherapy-induced myelosuppression"
    ],
    redFlagChecks: ["Severe mucositis from chemotherapy", "Bisphosphonate-related osteonecrosis (exposed bone)", "Signs of drug allergy (skin rash, swelling)"],
    actions: [
      "Document the suspected medication and timeline of ulcer development",
      "Consult prescribing physician about alternative medication options",
      "Do NOT stop medications without medical advice - discuss with prescribing doctor",
      "Symptomatic relief with topical anesthetic gel and salt water rinses"
    ],
  },
};

/**
 * Build the risk level badge text based on diagnosis metadata
 */
const RISK_DESCRIPTIONS = {
  LOW: "Based on the clinical features, this condition is classified as low risk. Regular monitoring and self-care should be sufficient.",
  MODERATE: "This condition warrants professional dental evaluation within 1-2 weeks to confirm diagnosis and guide treatment.",
  HIGH: "This condition requires prompt medical attention. A biopsy or specialist evaluation may be needed.",
  CRITICAL: "This is a potentially serious condition requiring immediate specialist evaluation. Do not delay seeking professional care.",
};

const URGENCY_DESCRIPTIONS = {
  ROUTINE: "Schedule a routine dental checkup within 2-4 weeks if symptoms persist.",
  SOON: "See a dental professional within 1-2 weeks for evaluation.",
  URGENT: "Seek specialist evaluation within 3-5 days. Earlier if symptoms worsen.",
  EMERGENCY: "Seek immediate specialist consultation. Do not delay.",
};

/**
 * Generate a full 8-section report from model prediction
 *
 * @param {string} diagnosis - Primary diagnosis name
 * @param {number} confidence - Confidence score (0-1)
 * @param {Array} topDiagnoses - Top 3 diagnoses with scores [{name, score}]
 * @param {string} riskLevel - Risk level (LOW/MODERATE/HIGH/CRITICAL)
 * @param {string} urgency - Urgency level (ROUTINE/SOON/URGENT/EMERGENCY)
 * @param {object} patientData - Patient form data for personalization
 * @returns {string} - Complete report text
 */
const DIAGNOSIS_CATEGORIES = {
  "Aphthous Minor": "Benign / Inflammatory",
  "Aphthous Major": "Benign / Inflammatory",
  "Herpetiform Aphthous": "Benign / Inflammatory",
  "Traumatic Ulcer": "Benign / Traumatic",
  "Herpetic (HSV-1)": "Infectious (Viral)",
  "Candidal Stomatitis": "Infectious (Fungal)",
  "Oral Lichen Planus": "Autoimmune / Immunological",
  "Leukoplakia": "Pre-malignant",
  "Erythroplakia": "Pre-malignant",
  "Squamous Cell Carcinoma": "Malignant",
  "Behcet's Disease": "Systemic / Immunological",
  "Nutritional Deficiency Ulcer": "Deficiency-related",
  "Drug-induced Ulcer": "Iatrogenic / Inflammatory"
};

function generateReport(diagnosis, confidence, topDiagnoses, riskLevel, urgency, patientData = {}) {
  const template = DIAGNOSIS_TEMPLATES[diagnosis];
  if (!template) {
    return `Diagnosis: ${diagnosis}\nConfidence: ${(confidence * 100).toFixed(0)}%\n\nNo detailed template available for this diagnosis. Please consult a dental professional.`;
  }

  const confidenceLabel = confidence > 0.7 ? "High" : confidence > 0.4 ? "Moderate" : "Low";

  // Check which red flags are actually present
  const presentRedFlags = [];
  if (patientData.lastingMoreThan2Weeks) presentRedFlags.push("Ulcer lasting more than 2 weeks");
  if (patientData.gettingBigger) presentRedFlags.push("Ulcer is progressively growing");
  if (patientData.hardRaisedEdges) presentRedFlags.push("Hard or raised edges detected");
  if (patientData.bleedsEasily) presentRedFlags.push("Ulcer bleeds easily");
  if (patientData.feverSwellingTiredness) presentRedFlags.push("Systemic symptoms present (fever/swelling/tiredness)");

  const redFlagsText = presentRedFlags.length > 0
    ? presentRedFlags.map(f => `- ${f}`).join("\n")
    : "- No red flags identified at this time";

  // Build key findings from patient data
  const keyFindings = [];
  if (patientData.duration) keyFindings.push(`Duration: ${patientData.duration}`);
  if (patientData.size) keyFindings.push(`Size: ${patientData.size}`);
  if (patientData.soreLocation) keyFindings.push(`Location: ${patientData.soreLocation}`);
  if (patientData.numberOfSores) keyFindings.push(`Number of sores: ${patientData.numberOfSores}`);
  if (patientData.firstTimeOrRecurring) keyFindings.push(`Pattern: ${patientData.firstTimeOrRecurring}`);
  if (patientData.tobaccoUse && patientData.tobaccoUse !== "Never") keyFindings.push(`Tobacco use: ${patientData.tobaccoUse}`);
  if (patientData.betelNutUse && patientData.betelNutUse !== "Never") keyFindings.push(`Betel nut use: ${patientData.betelNutUse}`);
  if (patientData.diabetes) keyFindings.push("Diabetes: Yes");
  if (patientData.vitaminDeficiency) keyFindings.push("Vitamin deficiency/anemia: Yes");
  if (patientData.bitCheekLip) keyFindings.push("Recent trauma: Bit cheek/lip");
  if (patientData.sharpToothRubbing) keyFindings.push("Sharp tooth rubbing against mucosa");

  const category = DIAGNOSIS_CATEGORIES[diagnosis] || "Unknown";

  const report = `1. MOST LIKELY DIAGNOSIS: ${diagnosis} (Confidence: ${confidenceLabel})
- ${template.explanation}

2. DIFFERENTIAL DIAGNOSES:
${template.differentials.map(d => `- ${d}`).join("\n")}

3. ULCER CATEGORY: ${category}
- General classification of the ulcer type

4. RISK LEVEL: ${riskLevel}
- ${RISK_DESCRIPTIONS[riskLevel] || "Please consult a healthcare provider."}

5. URGENCY: ${urgency}
- ${URGENCY_DESCRIPTIONS[urgency] || "Schedule a dental appointment."}

6. KEY FINDINGS:
${keyFindings.slice(0, 5).map(f => `- ${f}`).join("\n")}

7. RED FLAGS:
${redFlagsText}

8. RECOMMENDED ACTION:
${template.actions.map(a => `- ${a}`).join("\n")}

9. DISCLAIMER:
This AI screening report is for informational purposes only. It is not a substitute for professional medical examination. Please consult a licensed dental or medical professional for definitive diagnosis and treatment.`;

  return report;
}

export { DIAGNOSIS_TEMPLATES, generateReport };
