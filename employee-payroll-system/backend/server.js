const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();




const app = express(); // 👈 FIRST CREATE APP

/* ===== MIDDLEWARE ===== */
app.use(cors());
app.use(express.json());

/* ===== ROUTES ===== */
const employeeRoutes = require("./routes/employeeRoutes");
const salaryRoutes = require("./routes/salaryRoutes");
const authRoutes = require("./routes/authRoutes");

app.use("/api/employees", employeeRoutes);
app.use("/api/salary", salaryRoutes);
app.use("/api/auth", authRoutes);

/* ===== DB ===== */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected 😎"))
  .catch(err => console.error(err));

/* ===== SERVER ===== */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});