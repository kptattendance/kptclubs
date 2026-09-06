import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    clubId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Club",
      required: true,
      index: true,
    },

    attendanceDate: {
      type: Date,
      required: true,
      index: true,
    },

    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudentProfile",
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: ["PRESENT", "ABSENT"],
      required: true,
    },

    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    markedAt: {
      type: Date,
      default: Date.now,
    },

    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// One attendance entry per student per club per day
attendanceSchema.index(
  { clubId: 1, attendanceDate: 1, studentId: 1 },
  { unique: true }
);

attendanceSchema.index({
  clubId: 1,
  attendanceDate: 1,
});

attendanceSchema.index({
  studentId: 1,
  attendanceDate: 1,
});

const Attendance = mongoose.model("Attendance", attendanceSchema);

export default Attendance;