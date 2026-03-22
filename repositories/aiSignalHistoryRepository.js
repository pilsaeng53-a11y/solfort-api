const { getDb } = require("../config/db");

async function saveAiSignal({
  id,
  symbol,
  score,
  label,
  confidence,
  explanation,
  sourceTimestamp
}) {
  const db = getDb();
  if (!db) throw new Error("DB not connected");

  const result = await db.query(
    `INSERT INTO ai_signal_history
      (id, symbol, score, label, confidence, explanation, source_timestamp)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [id, symbol, score, label, confidence, explanation, sourceTimestamp]
  );

  return result.rows[0];
}

async function getRecentSignals(symbol, limit = 20) {
  const db = getDb();
  if (!db) return [];

  const result = await db.query(
    `SELECT * FROM ai_signal_history
     WHERE symbol = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [symbol, limit]
  );

  return result.rows;
}

module.exports = {
  saveAiSignal,
  getRecentSignals
};
