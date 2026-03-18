const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    dateKey: {
      type: String,
      required: true
    },
    checkInAt: {
      type: Date
    },
    checkOutAt: {
      type: Date
    },
    faceMatched: {
      type: Boolean,
      required: true,
      default: false
    },
    locationVerified: {
      type: Boolean,
      required: true,
      default: false
    },
    deviceType: {
      type: String,
      enum: ["desktop", "mobile", "unknown"],
      default: "unknown"
    },
    location: {
      lat: Number,
      lng: Number,
      accuracy: Number
    },
    selfieImageRef: {
      type: String,
      default: ""
    },
    checkInSelfieRef: {
      type: String,
      default: ""
    },
    checkOutSelfieRef: {
      type: String,
      default: ""
    },
    meta: {
      distanceFromOfficeMeters: Number
    }
  },
  { timestamps: true }
);

attendanceSchema.index({ userId: 1, dateKey: 1 }, { unique: true });

module.exports = mongoose.model("Attendance", attendanceSchema);
