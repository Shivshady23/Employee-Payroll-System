const bcrypt = require("bcryptjs");
const { connectDatabase, mongoose } = require("./config/db");
const { getMongoUri } = require("./config/env");
const User = require("./models/User");

const setupDatabase = async () => {
  try {
    const mongoUri = getMongoUri();

    await connectDatabase(mongoUri);
    console.log("Connected to MongoDB");

    const adminExists = await User.findOne({ email: "admin@example.com" });
    const superadminExists = await User.findOne({ email: "superadmin@example.com" });

    if (adminExists && superadminExists) {
      console.log("Test users already exist - skipping setup");
      await mongoose.connection.close();
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash("password123", 10);
    console.log("Password hashed");

    if (!adminExists) {
      await User.create({
        name: "Admin User",
        email: "admin@example.com",
        password: hashedPassword,
        role: "admin",
        employeeId: null
      });
      console.log("Admin user created");
    }

    if (!superadminExists) {
      await User.create({
        name: "Superadmin User",
        email: "superadmin@example.com",
        password: hashedPassword,
        role: "superadmin",
        employeeId: null
      });
      console.log("Superadmin user created");
    }

    console.log("\nDatabase setup complete.");
    console.log("\nTest Credentials:");
    console.log("Admin:      admin@example.com / password123");
    console.log("Superadmin: superadmin@example.com / password123");
    console.log("\nReady to start the application.");

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("Setup error:", error.message);
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
};

setupDatabase();
