const express = require("express");
const router = express.Router();

/**
 * SAFE ORDER ROUTES (완전 안전버전)
 */

router.get("/", (req, res) => {
  res.json({
    ok: true,
    message: "Orders route alive"
  });
});

router.post("/", (req, res) => {
  res.json({
    ok: true,
    type: "createOrder",
    body: req.body || {}
  });
});

router.delete("/:orderId", (req, res) => {
  res.json({
    ok: true,
    type: "cancelOrder",
    orderId: req.params.orderId
  });
});

router.post("/open", (req, res) => {
  res.json({
    ok: true,
    type: "openOrders",
    body: req.body || {}
  });
});

module.exports = router;
