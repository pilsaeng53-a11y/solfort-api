const express = require("express");

const router = express.Router();

/**
 * TEMP SAFE ROUTES
 * portfolio 연결 테스트용
 */

router.get("/", (req, res) => {
  res.json({
    ok: true,
    message: "Portfolio route is alive"
  });
});

router.post("/positions", async (req, res) => {
  try {
    return res.json({
      ok: true,
      type: "positions",
      received: req.body || {}
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.post("/balances", async (req, res) => {
  try {
    return res.json({
      ok: true,
      type: "balances",
      received: req.body || {}
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
