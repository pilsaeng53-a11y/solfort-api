const express = require("express");
const {
  registerAccount,
  getAccountInfo
} = require("../services/orderlyAccountService");

const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    const { walletAddress, brokerId, chainId } = req.body;

    if (!walletAddress) {
      return res.status(400).json({ error: "walletAddress is required" });
    }

    const result = await registerAccount({
      walletAddress,
      brokerId,
      chainId
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/info", async (req, res) => {
  try {
    const { accountId, orderlyKey, signature, timestamp } = req.body;

    const result = await getAccountInfo({
      accountId,
      orderlyKey,
      signature,
      timestamp
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
