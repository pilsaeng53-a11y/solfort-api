const { getDb } = require("../config/db");

async function getNotifications(userId) {
  const db = getDb();
  if (!db) return [];

  const result = await db.query(
    `SELECT * FROM notifications
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [userId]
  );

  return result.rows;
}

module.exports = {
  getNotifications
};
