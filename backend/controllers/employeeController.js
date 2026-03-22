const Employee = require("../models/Employee");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const sendCredentialEmail = require("../utils/sendCredentialEmail");

/* ADMIN CREATES EMPLOYEE */
exports.createEmployee = async (req, res) => {
  try {
    const { name, email, contactNumber, dob, dateOfJoining } = req.body;

    // age validation (already done before)
    const birthDate = new Date(dob);
    const joiningDate = new Date(dateOfJoining);

    const age =
      joiningDate.getFullYear() -
      birthDate.getFullYear() -
      (joiningDate <
      new Date(
        joiningDate.getFullYear(),
        birthDate.getMonth(),
        birthDate.getDate()
      )
        ? 1
        : 0);

    if (age < 18) {
      return res.status(400).json({
        message: "Employee must be at least 18 years old"
      });
    }

    /* 1) CREATE EMPLOYEE */
    const employee = await Employee.create({
      name,
      email,
      contactNumber,
      dob,
      dateOfJoining
    });

    /* 2) AUTO-GENERATE PASSWORD */
    const tempPassword = crypto.randomBytes(8).toString("hex");
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    /* 3) CREATE USER ACCOUNT */
    await User.create({
      name,
      email,
      password: hashedPassword,
      role: "user",
      employeeId: employee._id
    });

    /* 4) SEND CREDENTIAL EMAIL (non-blocking for employee creation) */
    let emailSent = true;
    try {
      await sendCredentialEmail({
        name: employee.name,
        email: employee.email,
        loginId: employee.email,
        password: tempPassword,
        employeeCode: employee.employeeCode
      });
    } catch (err) {
      emailSent = false;
      console.error("Email sending failed:", err);
    }

    /* 5) SEND RESPONSE (PASSWORD SHOWN ONCE AS FALLBACK) */
    res.status(201).json({
      success: true,
      message: "Employee created successfully",
      data: {
        employee,
        loginId: employee.email,
        tempPassword
      },
      emailSent
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* GET ALL EMPLOYEES (PAGINATED + SEARCH) */
exports.getEmployees = async (req, res) => {
  try {
    const isUser = req.user?.role === "user";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";

    const skip = (page - 1) * limit;

    const searchRegex = new RegExp(search, "i");
    const filter = isUser
      ? { _id: req.user.employeeId }
      : {
          $or: [
            { name: searchRegex },
            { email: searchRegex },
            { contactNumber: searchRegex },
            { employeeCode: searchRegex }
          ]
        };

    const employees = await Employee.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const totalEmployees = await Employee.countDocuments(filter);
    const pages = Math.ceil(totalEmployees / limit);

    res.json({
      employees,
      page,
      pages,
      total: totalEmployees
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* GET LOGGED-IN EMPLOYEE */
exports.getMyEmployee = async (req, res) => {
  try {
    if (!req.user?.employeeId) {
      return res.status(404).json({ message: "Employee mapping not found" });
    }

    const employee = await Employee.findById(req.user.employeeId);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    return res.json(employee);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

/* DELETE EMPLOYEE */
exports.deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    const employee = await Employee.findByIdAndDelete(id);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    // Also delete associated user
    await User.deleteOne({ email: employee.email });

    res.json({ message: "Employee deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
