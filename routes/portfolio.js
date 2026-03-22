const express = require("express");
const {
  getPositions,
  getBalances
} = require("../services/orderExecutionService");

const router = express.Router();

router.post("/positions", async (req, res) => {
  try {
    const {
      accountId,
      orderlyKey,
      orderlySecret
    } = req.body;

    const result = await getPositions({
      accountId,
      orderlyKey,
      orderlySecret
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/balances", async (req, res) => {
  try {
    const {
      accountId,
      orderlyKey,
      orderlySecret
    } = req.body;

    const result = await getBalances({
      accountId,
      orderlyKey,
      orderlySecret
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
