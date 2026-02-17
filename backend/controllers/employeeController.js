const Employee = require("../models/Employee");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const sendEmail = require("../utils/sendEmail");

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
    const plainPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    /* 3) CREATE USER ACCOUNT */
    await User.create({
      name,
      email,
      password: hashedPassword,
      role: "user",
      employeeId: employee._id
    });

    /* 4) SEND EMAIL */
    await sendEmail(
      email,
      "Your Employee Login Credentials",
      `Welcome ${name},

Your account has been created.

Login Details:
Email: ${email}
Password: ${plainPassword}

Please change your password after login.

- Payroll System`
    );

    /* 5) SEND RESPONSE (PASSWORD SHOWN ONCE) */
    res.status(201).json({
      message: "Employee and user account created",
      credentials: {
        email,
        password: plainPassword
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* GET ALL EMPLOYEES (PAGINATED + SEARCH) */
exports.getEmployees = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";

    const skip = (page - 1) * limit;

    const searchRegex = new RegExp(search, "i");
    const filter = {
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
