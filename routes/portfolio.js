const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  res.json({ ok: true, message: "portfolio alive" });
});

router.post("/positions", (req, res) => {
  res.json({ ok: true, type: "positions", body: req.body || {} });
});

router.post("/balances", (req, res) => {
  res.json({ ok: true, type: "balances", body: req.body || {} });
});

module.exports = router;
