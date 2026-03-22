const express = require("express");
const rateLimit = require("express-rate-limit");
const { ipKeyGenerator } = rateLimit;

const { chat } = require("../controllers/aiAssistantController");
const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");

const router = express.Router();

const aiRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: req => req.user?.id || ipKeyGenerator(req.ip),
  message: {
    success: false,
    message: "Too many AI assistant requests. Please wait a minute and try again."
  }
});

router.post("/chat", auth, role("admin", "superadmin"), aiRateLimiter, chat);

module.exports = router;
