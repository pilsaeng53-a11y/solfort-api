module.exports = {
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || "development",
  DATABASE_URL: process.env.DATABASE_URL || "",
  JWT_SECRET: process.env.JWT_SECRET || "change-me",
  CACHE_TTL_MS: Number(process.env.CACHE_TTL_MS || 5000)
};
