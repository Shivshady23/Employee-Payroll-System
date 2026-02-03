const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true
    },

    contactNumber: {
      type: String,
      required: true,
      match: [/^\d{10}$/, "Contact number must be 10 digits"]
    },

    dob: {
      type: Date,
      required: true
    },

    dateOfJoining: {
      type: Date,
      required: true
    },

    employeeCode: {
      type: String,
      unique: true
    }
  },
  { timestamps: true }
);

employeeSchema.pre("save", async function () {
  if (this.employeeCode) return;

  const lastEmployee = await mongoose
    .model("Employee")
    .findOne()
    .sort({ createdAt: -1 });

  let newCode = "1000";

  if (lastEmployee && lastEmployee.employeeCode) {
    newCode = (parseInt(lastEmployee.employeeCode) + 1).toString();
  }

  this.employeeCode = newCode;
});

module.exports = mongoose.model("Employee", employeeSchema);