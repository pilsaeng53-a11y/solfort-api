const express = require("express");
const fetch = require("node-fetch");
const app = express();

app.get("/", (req, res) => {
  res.send("Solfort API running 🚀");
});

// 실제 Open Interest 가져오기
app.get("/open-interest", async (req, res) => {
  try {
    const response = await fetch("https://api.orderly.org/v1/public/interest/BTC-USDT");
    const data = await response.json();

    res.json({
      symbol: "BTC-USDT",
      openInterest: data.data.open_interest,
      change: data.data.change_24h
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch OI" });
  }
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
