const mongoose = require("mongoose");

mongoose.set("bufferCommands", false);

let connectPromise;

// Shared connection helper to avoid duplicate connection attempts on concurrent requests.
const connectDatabase = async mongoUri => {
  process.env.MONGO_URI = mongoUri;

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

module.exports = { mongoose, connectDatabase };
