import mongoose from "mongoose";

const studentProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    registerNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },

    semester: {
      type: Number,
      required: true,
      min: 1,
      max: 6,
    },

    admissionYear: {
      type: Number,
      required: true,
    },

    // Cloudinary URL
    photoUrl: {
      type: String,
      default: "",
      trim: true,
    },

    status: {
      type: String,
      enum: [
        "ACTIVE",
        "GRADUATED",
        "DISCONTINUED",
        "TRANSFERRED",
      ],
      default: "ACTIVE",
    },
  },
  {
    timestamps: true,
  }
);

const StudentProfile = mongoose.model(
  "StudentProfile",
  studentProfileSchema
);

export default StudentProfile;