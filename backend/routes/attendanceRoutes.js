const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");
const {
  registerFace,
  checkIn,
  checkOut,
  getTodayAttendance
} = require("../controllers/attendanceController");

router.use(auth);
router.use(role("user", "admin", "superadmin"));

router.post("/register-face", registerFace);
router.post("/check-in", checkIn);
router.post("/check-out", checkOut);
router.get("/today", getTodayAttendance);

module.exports = router;
