const express = require("express");
const { body } = require("express-validator");

const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");
const validateRequest = require("../middleware/validateRequest");
const { runMonthlyPayslipJob } = require("../jobs/sendMonthlyPayslips");

const router = express.Router();

router.post(
  "/send-now",
  auth,
  role("superadmin"),
  [
    body("month")
      .optional()
      .isInt({ min: 1, max: 12 })
      .withMessage("'month' must be an integer between 1 and 12"),
    body("year")
      .optional()
      .isInt({ min: 2000, max: 9999 })
      .withMessage("'year' must be a 4-digit integer")
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { month, year } = req.body || {};
      const result = await runMonthlyPayslipJob({ month, year });

      return res.status(200).json({
        success: true,
        sent: result.sent,
        failed: result.failed
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

module.exports = router;
