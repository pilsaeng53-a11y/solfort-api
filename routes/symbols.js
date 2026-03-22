const express = require("express");
const { getAllTradingPairs } = require("../services/symbolResolver");

const router = express.Router();

router.get("/", (req, res) => {
  try {
    const pairs = getAllTradingPairs();
    res.json(pairs);
  } catch (error) {
    res.status(500).json({ error: "Failed to load trading pairs" });
  }
});

module.exports = router;
