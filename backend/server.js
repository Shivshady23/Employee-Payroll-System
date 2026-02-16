const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

if (process.env.NODE_ENV !== "production") {
  require("dotenv").config({ path: path.join(__dirname, ".env") });
}

const app = express();

/* ===== MIDDLEWARE ===== */
app.use(cors());
app.use(express.json());
mongoose.set("bufferCommands", false);

/* ===== DB ===== */
let connectPromise;

const validateEnvironment = () => {
  const missing = [];

  if (!process.env.MONGO_URI) {
    missing.push("MONGO_URI");
  }

  if (!process.env.JWT_SECRET) {
    missing.push("JWT_SECRET");
  }

  if (missing.length > 0) {
    throw new Error(`Missing environment variable(s): ${missing.join(", ")}`);
  }
};

const connectDatabase = async () => {
  validateEnvironment();

  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (connectPromise) {
    return connectPromise;
  }

  connectPromise = mongoose
    .connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000 })
    .then(() => {
      console.log("MongoDB connected");
      return mongoose.connection;
    })
    .finally(() => {
      connectPromise = null;
    });

  return connectPromise;
};

app.use(async (req, res, next) => {
  if (req.path === "/api/health") {
    return next();
  }

  try {
    await connectDatabase();
    return next();
  } catch (error) {
    return res.status(503).json({
      message:
        "Database not connected. Check MONGO_URI and Atlas Network Access allowlist.",
      error: error.message
    });
  }
});

/* ===== ROUTES ===== */
const employeeRoutes = require("./routes/employeeRoutes");
const salaryRoutes = require("./routes/salaryRoutes");
const authRoutes = require("./routes/authRoutes");

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

/* ===== SERVER ===== */
// Vercel provides the server; exporting the app creates a serverless function.
module.exports = app;

if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;

  connectDatabase()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
      });
    })
    .catch(error => {
      console.error(`Failed to start server: ${error.message}`);
      process.exit(1);
    });
} else {
  connectDatabase().catch(error => {
    console.error(`Initial MongoDB connection failed: ${error.message}`);
  });
}

