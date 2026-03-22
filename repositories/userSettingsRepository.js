const { getDb } = require("../config/db");

async function getUserSettings(userId) {
  const db = getDb();
  if (!db) return null;

  const result = await db.query(
    "SELECT * FROM user_settings WHERE user_id = $1 LIMIT 1",
    [userId]
  );

  return result.rows[0] || null;
}

async function upsertUserSettings({
  id,
  userId,
  preferredSymbol,
  preferredLeverage,
  theme,
  language
}) {
  const db = getDb();
  if (!db) throw new Error("DB not connected");

  const result = await db.query(
    `INSERT INTO user_settings
      (id, user_id, preferred_symbol, preferred_leverage, theme, language)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (id)
     DO UPDATE SET
      preferred_symbol = EXCLUDED.preferred_symbol,
      preferred_leverage = EXCLUDED.preferred_leverage,
      theme = EXCLUDED.theme,
      language = EXCLUDED.language,
      updated_at = NOW()
     RETURNING *`,
    [id, userId, preferredSymbol, preferredLeverage, theme, language]
  );

  return result.rows[0];
}

module.exports = {
  getUserSettings,
  upsertUserSettings
};
