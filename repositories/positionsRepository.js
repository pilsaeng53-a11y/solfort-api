const { getDb } = require("../config/db");

async function getOpenPositions(userId) {
  const db = getDb();
  if (!db) return [];

  const result = await db.query(
    `SELECT * FROM positions
     WHERE user_id = $1 AND status = 'open'
     ORDER BY updated_at DESC`,
    [userId]
  );

  return result.rows;
}

module.exports = {
  getOpenPositions
};
