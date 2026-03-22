const express = require("express");

const router = express.Router();

router.get("/:symbol", (req, res) => {
  const symbol = req.params.symbol;

  res.json({
    symbol,
    score: 74,
    label: "강세",
    confidence: "높은 신뢰도",
    signalCount: 6,
    updatedAt: Date.now(),
    explanation: "현재 추세 및 거래량 흐름 기준으로 강세 우위로 해석됩니다."
  });
});

module.exports = router;
