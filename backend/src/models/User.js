import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    clerkUserId: {
      type: String,
      unique: true,
      sparse: true,
      default: null,
      index: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    phone: {
      type: String,
      default: "",
      trim: true,
    },

    profilePhoto: {
      type: String,
      default: "",
      trim: true,
    },

    userType: {
      type: String,
      enum: ["STUDENT", "FACULTY", "STAFF"],
      required: true,
    },

    role: {
      type: String,
      enum: [
        "STUDENT",
        "CLUB_INCHARGE",
        "HOD",
        "PRINCIPAL",
        "ADMIN",
      ],
      required: true,
    },

    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      default: null,
    },

    clubId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Club",
      default: null,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);

export default User;