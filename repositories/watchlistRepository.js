const { getDb } = require("../config/db");

async function getWatchlist(userId) {
  const db = getDb();
  if (!db) return [];

  const result = await db.query(
    "SELECT * FROM watchlists WHERE user_id = $1 ORDER BY created_at DESC",
    [userId]
  );

  return result.rows;
}

async function addWatchlistItem({ id, userId, symbol }) {
  const db = getDb();
  if (!db) throw new Error("DB not connected");

  const result = await db.query(
    `INSERT INTO watchlists (id, user_id, symbol)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [id, userId, symbol]
  );

  return result.rows[0];
}

module.exports = {
  getWatchlist,
  addWatchlistItem
};
