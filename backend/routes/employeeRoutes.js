const express = require("express");
const router = express.Router();

const {
  createEmployee,
  getEmployees,
  deleteEmployee,
  getMyEmployee
} = require("../controllers/employeeController");

const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");

/* ADMIN + SUPERADMIN */
router.post("/create", auth, role("admin", "superadmin"), createEmployee);

/* USER + ADMIN + SUPERADMIN */
router.get("/", auth, role("user", "admin", "superadmin"), getEmployees);
router.get("/me", auth, role("user", "admin", "superadmin"), getMyEmployee);

/* SUPERADMIN ONLY */
router.delete("/:id", auth, role("superadmin"), deleteEmployee);

module.exports = router;
