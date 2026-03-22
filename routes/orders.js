const express = require("express");
const {
  createOrder,
  cancelOrder,
  getOpenOrders
} = require("../services/orderExecutionService");

const router = express.Router();

/**
 * CREATE ORDER
 */
router.post("/", async (req, res) => {
  try {
    const {
      accountId,
      orderlyKey,
      orderlySecret,
      order
    } = req.body;

    // ✅ 필수값 체크 (문법 정상)
    if (!accountId  !orderlyKey  !orderlySecret || !order) {
      return res.status(400).json({
        error: "Missing required fields",
        required: ["accountId", "orderlyKey", "orderlySecret", "order"]
      });
    }

    const result = await createOrder({
      accountId,
      orderlyKey,
      orderlySecret,
      order
    });

    res.json(result);
  } catch (error) {
    console.error("Create order error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * CANCEL ORDER
 */
router.delete("/:orderId", async (req, res) => {
  try {
    const {
      accountId,
      orderlyKey,
      orderlySecret
    } = req.body;

    const { orderId } = req.params;

    if (!accountId  !orderlyKey  !orderlySecret || !orderId) {
      return res.status(400).json({
        error: "Missing required fields"
      });
    }

    const result = await cancelOrder({
      accountId,
      orderlyKey,
      orderlySecret,
      orderId
    });

    res.json(result);
  } catch (error) {
    console.error("Cancel order error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET OPEN ORDERS
 */
router.post("/open", async (req, res) => {
  try {
    const {
      accountId,
      orderlyKey,
      orderlySecret
    } = req.body;

    if (!accountId  !orderlyKey  !orderlySecret) {
      return res.status(400).json({
        error: "Missing required fields"
      });
    }

    const result = await getOpenOrders({
      accountId,
      orderlyKey,
      orderlySecret
    });

    res.json(result);
  } catch (error) {
    console.error("Get open orders error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
