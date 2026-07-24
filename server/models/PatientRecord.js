import mongoose from "mongoose";

const patientRecordSchema = new mongoose.Schema(
  {
    patientName: {
      type: String,
      default: "Anonymous",
    },

    symptoms: {
      type: Object,
      default: {},
    },

    diagnosis: {
      type: String,
      default: "",
    },

    aiResponse: {
      type: String,
      default: "",
    },

    riskLevel: {
      type: String,
      default: "UNKNOWN",
    },

    urgency: {
      type: String,
      default: "ROUTINE",
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    userEmail: {
      type: String,
      default: "",
    },

    imageUrl: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

const PatientRecord = mongoose.model("PatientRecord", patientRecordSchema);

export default PatientRecord;