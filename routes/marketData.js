const express = require("express");
const {
  fetchTicker,
  fetchOpenInterests,
  fetchMarketInfo
} = require("../services/publicMarketService");

const router = express.Router();

router.get("/ticker/:symbol", async (req, res) => {
  try {
    const data = await fetchTicker(req.params.symbol);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/open-interests", async (req, res) => {
  try {
    const data = await fetchOpenInterests();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/info", async (req, res) => {
  try {
    const data = await fetchMarketInfo();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
