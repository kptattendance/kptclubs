import mongoose from "mongoose";

const clubMembershipSchema = new mongoose.Schema(
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

    status: {
      type: String,
      enum: [
        "PENDING_CLUB_APPROVAL",
        "PENDING_HOD_APPROVAL",
        "CONFIRMED",
        "REJECTED_BY_CLUB",
        "REJECTED_BY_HOD",
        "CANCELLED",
      ],
      default: "PENDING_CLUB_APPROVAL",
      index: true,
    },

    // Club In-charge approval
    clubApprovedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    clubApprovedAt: {
      type: Date,
      default: null,
    },

    clubRejectionReason: {
      type: String,
      default: null,
      trim: true,
    },

    // HOD approval
    hodApprovedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    hodApprovedAt: {
      type: Date,
      default: null,
    },

    hodRejectionReason: {
      type: String,
      default: null,
      trim: true,
    },

    // Actual joining date
    joinedAt: {
      type: Date,
      default: null,
    },

    // Date student leaves the club
    leftAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// A student cannot submit the same club application twice.
clubMembershipSchema.index(
  { studentId: 1, clubId: 1 },
  { unique: true }
);

const ClubMembership = mongoose.model(
  "ClubMembership",
  clubMembershipSchema
);

export default ClubMembership;