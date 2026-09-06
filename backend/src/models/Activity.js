import mongoose from "mongoose";

const activitySchema = new mongoose.Schema(
  {
    clubId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Club",
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    activityType: {
      type: String,
      enum: [
        "WORKSHOP",
        "SEMINAR",
        "COMPETITION",
        "MEETING",
        "TRAINING",
        "EVENT",
        "AWARENESS_PROGRAM",
        "OTHER",
      ],
      default: "OTHER",
    },

    date: {
      type: Date,
      required: true,
    },

    startTime: {
      type: String,
      default: null,
    },

    endTime: {
      type: String,
      default: null,
    },

    venue: {
      type: String,
      default: "",
      trim: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
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

const Activity = mongoose.model("Activity", activitySchema);

export default Activity;