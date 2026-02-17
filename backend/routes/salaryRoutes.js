const express = require("express");
const router = express.Router();

const { createSalary, getEmployeeSalary } = require("../controllers/salaryController");
const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");

/* ADMIN + SUPERADMIN */
router.post("/create", auth, role("admin", "superadmin"), createSalary);

/* USER: own salary ONLY */
router.get("/:employeeId", auth, getEmployeeSalary);

module.exports = router;
