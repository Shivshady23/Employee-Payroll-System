const mongoose = require("mongoose");

const salarySchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true
    },

    basic: {
      type: Number,
      required: true
    },

    hra: {
      type: Number,
      required: true
    },

    conveyance: {
      type: Number,
      required: true
    },

    totalEarnings: Number,

    // PF Contributions
    employeePF: Number,
    employerPF: Number,
    employerPensionContribution: Number,
    pensionContribution: Number,

    // ESIC Contributions
    employeeESIC: Number,
    employerESIC: Number,
    esicApplicable: Boolean,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Salary", salarySchema);