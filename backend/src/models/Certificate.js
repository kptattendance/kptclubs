import mongoose from "mongoose";

const certificateSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudentProfile",
      required: true,
      index: true,
    },

    clubId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Club",
      required: true,
      index: true,
    },

    certificateNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    academicStartYear: {
      type: Number,
      required: true,
    },

    academicEndYear: {
      type: Number,
      required: true,
    },

    attendancePercentage: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: [
        "ELIGIBLE",
        "PENDING_APPROVAL",
        "APPROVED",
        "REJECTED",
        "ISSUED",
      ],
      default: "ELIGIBLE",
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    approvedAt: {
      type: Date,
      default: null,
    },

    certificateUrl: {
      type: String,
      default: null,
    },

    issuedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// One certificate for one student in one club
certificateSchema.index(
  { studentId: 1, clubId: 1 },
  { unique: true }
);

const Certificate = mongoose.model(
  "Certificate",
  certificateSchema
);

export default Certificate;