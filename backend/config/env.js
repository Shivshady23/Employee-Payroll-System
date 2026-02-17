const path = require("path");

// Render injects env vars at runtime. For local development we load backend/.env.
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
}

const sanitizeEnvValue = value =>
  (value || "").trim().replace(/^['"]|['"]$/g, "");

const getRequiredEnv = key => {
  const value = sanitizeEnvValue(process.env[key]);
  if (!value) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value;
};

const validateMongoUri = mongoUri => {
  if (!/^mongodb(\+srv)?:\/\//.test(mongoUri)) {
    throw new Error(
      'Invalid MONGO_URI format. It must start with "mongodb://" or "mongodb+srv://".'
    );
  }
};

const getMongoUri = () => {
  const mongoUri = getRequiredEnv("MONGO_URI");
  validateMongoUri(mongoUri);
  process.env.MONGO_URI = mongoUri;
  return mongoUri;
};

const getRuntimeConfig = () => {
  const mongoUri = getMongoUri();
  const jwtSecret = getRequiredEnv("JWT_SECRET");
  const corsOrigin = sanitizeEnvValue(process.env.CORS_ORIGIN);
  const port = Number(process.env.PORT) || 5000;

  process.env.JWT_SECRET = jwtSecret;
  process.env.CORS_ORIGIN = corsOrigin;

  return { mongoUri, jwtSecret, corsOrigin, port };
};

const parseCorsOrigins = corsOrigin =>
  corsOrigin
    .split(",")
    .map(origin => origin.trim())
    .filter(Boolean);

module.exports = {
  getMongoUri,
  getRuntimeConfig,
  parseCorsOrigins,
  sanitizeEnvValue,
  validateMongoUri
};
