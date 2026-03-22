const mongoose = require("mongoose");

const payslipLogSchema = new mongoose.Schema(
  {
    month: {
      type: Number,
      required: true
    },
    year: {
      type: Number,
      required: true
    },
    totalEmployees: {
      type: Number,
      required: true
    },
    sent: {
      type: Number,
      required: true
    },
    failed: {
      type: Number,
      required: true
    },
    runAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("PayslipLog", payslipLogSchema);
