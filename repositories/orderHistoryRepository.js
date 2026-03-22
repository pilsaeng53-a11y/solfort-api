const { getDb } = require("../config/db");

async function getOrderHistory(userId) {
  const db = getDb();
  if (!db) return [];

  const result = await db.query(
    `SELECT * FROM order_history
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [userId]
  );

  return result.rows;
}

module.exports = {
  getOrderHistory
};
