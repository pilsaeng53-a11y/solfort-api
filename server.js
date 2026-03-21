const express = require("express");
const app = express();

app.use(express.json());

// 테스트 루트
app.get("/", (req, res) => {
  res.send("Solfort API running 🚀");
});

// Open Interest 테스트 API
app.get("/open-interest", (req, res) => {
  res.json({
    symbol: "BTC-USDT",
    openInterest: Math.floor(Math.random() * 1000000),
    change: (Math.random() * 2 - 1).toFixed(2)
  });
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
