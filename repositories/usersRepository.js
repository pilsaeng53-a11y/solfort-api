const { getDb } = require("../config/db");

async function findUserByEmail(email) {
  const db = getDb();
  if (!db) return null;

  const result = await db.query(
    "SELECT * FROM users WHERE email = $1 LIMIT 1",
    [email]
  );

  return result.rows[0] || null;
}

async function createUser({ id, email, nickname }) {
  const db = getDb();
  if (!db) throw new Error("DB not connected");

  const result = await db.query(
    `INSERT INTO users (id, email, nickname)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [id, email, nickname]
  );

  return result.rows[0];
}

module.exports = {
  findUserByEmail,
  createUser
};
