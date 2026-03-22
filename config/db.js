const { Pool } = require("pg");
const { DATABASE_URL } = require("./env");

let pool = null;

function getDb() {
  if (!DATABASE_URL) {
    return null;
  }

  if (!pool) {
    pool = new Pool({
      connectionString: DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
  }

  return pool;
}

async function testDbConnection() {
  const db = getDb();
  if (!db) {
    return { ok: false, reason: "DATABASE_URL not set" };
  }

  try {
    await db.query("SELECT NOW()");
    return { ok: true };
  } catch (error) {
    return { ok: false, reason: error.message };
  }
}

module.exports = {
  getDb,
  testDbConnection
};
