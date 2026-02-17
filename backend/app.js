const express = require("express");
const cors = require("cors");
const { connectDatabase, mongoose } = require("./config/db");
const { getRuntimeConfig, parseCorsOrigins } = require("./config/env");

const employeeRoutes = require("./routes/employeeRoutes");
const salaryRoutes = require("./routes/salaryRoutes");
const authRoutes = require("./routes/authRoutes");

const app = express();
const { mongoUri, corsOrigin } = getRuntimeConfig();

const allowedOrigins = new Set(parseCorsOrigins(corsOrigin));
const allowAllOrigins = allowedOrigins.size === 0;
const vercelHostPattern = /\.vercel\.app$/i;

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowAllOrigins || allowedOrigins.has(origin)) {
        return callback(null, true);
      }

      try {
        const hostname = new URL(origin).hostname;
        if (vercelHostPattern.test(hostname)) {
          return callback(null, true);
        }
      } catch (_error) {
        // Keep the response consistent for malformed origins.
      }

      return callback(new Error("Not allowed by CORS"));
    }
  })
);
app.use(express.json());

// Render startup resiliency: keep /api/health reachable even if DB is unavailable.
app.use(async (req, res, next) => {
  if (req.path === "/api/health") {
    return next();
  }

  try {
    await connectDatabase(mongoUri);
    return next();
  } catch (error) {
    return res.status(503).json({
      message:
        "Database not connected. Check MONGO_URI and Atlas Network Access allowlist.",
      error: error.message
    });
  }
});

app.use("/api/employees", employeeRoutes);
app.use("/api/salary", salaryRoutes);
app.use("/api/auth", authRoutes);

app.get("/api/health", (_req, res) => {
  const dbConnected = mongoose.connection.readyState === 1;
  return res.status(dbConnected ? 200 : 503).json({
    status: dbConnected ? "ok" : "degraded",
    dbConnected
  });
});

module.exports = app;
