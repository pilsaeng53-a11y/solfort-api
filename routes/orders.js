const express = require("express");
const {
  createOrder,
  cancelOrder,
  getOpenOrders
} = require("../services/orderExecutionService");

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const {
      accountId,
      orderlyKey,
      orderlySecret,
      order
    } = req.body;

    if (!accountId  !orderlyKey  !orderlySecret || !order) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const result = await createOrder({
      accountId,
      orderlyKey,
      orderlySecret,
      order
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/:orderId", async (req, res) => {
  try {
    const {
      accountId,
      orderlyKey,
      orderlySecret
    } = req.body;

    const { orderId } = req.params;

    const result = await cancelOrder({
      accountId,
      orderlyKey,
      orderlySecret,
      orderId
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/open", async (req, res) => {
  try {
    const {
      accountId,
      orderlyKey,
      orderlySecret
    } = req.body;

    const result = await getOpenOrders({
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
