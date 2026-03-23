const express = require("express");
const app = express();

app.use(express.json());

// =====================
// CORE ROUTES
// =====================
const coinIconsRoute = require("./routes/coinIcons");
const marketDataRoute = require("./routes/marketData");
const aiSignalsRoute = require("./routes/aiSignals");
const symbolsRoute = require("./routes/symbols");

// =====================
// SAFE USER ROUTES
// =====================
const userSettingsRoute = require("./routes/userSettings");
const watchlistsRoute = require("./routes/watchlists");
const notificationsRoute = require("./routes/notifications");

// =====================
// ORDERLY / TRADING ROUTES
// =====================
const orderlyAccountRoute = require("./routes/orderlyAccount");
const portfolioRoute = require("./routes/portfolio");
const ordersRoute = require("./routes/orders");

// =====================
// MOUNT CORE ROUTES
// =====================
app.use("/coin-icons", coinIconsRoute);
app.use("/market-data", marketDataRoute);
app.use("/ai-signals", aiSignalsRoute);
app.use("/symbols", symbolsRoute);

// =====================
// MOUNT SAFE USER ROUTES
// =====================
app.use("/user-settings", userSettingsRoute);
app.use("/watchlists", watchlistsRoute);
app.use("/notifications", notificationsRoute);

// =====================
// MOUNT ORDERLY / TRADING ROUTES
// =====================
app.use("/orderly-account", orderlyAccountRoute);
app.use("/portfolio", portfolioRoute);
app.use("/orders", ordersRoute);

// =====================
// SALES SUBMIT
// =====================
app.post("/sales/submit", (req, res) => {
  try {
    const {
      customerName,
      walletAddress,
      sales,
      quantity,
      price,
      promotion,
      sofAmount
    } = req.body;

    const payload = {
      name: customerName || "",
      wallet: walletAddress || "",
      sales: Number(sales || 0),
      quantity: Number(quantity || 0),
      price: Number(price || 0),
      promotion: Number(promotion || 0),
      sofAmount: Number(sofAmount || 0),
      submittedAt: new Date().toISOString()
    };

    console.log("SALES SUBMIT:", payload);

    return res.json({
      ok: true,
      message: "Sales submission received",
      data: payload
    });
  } catch (error) {
    console.error("SALES SUBMIT ERROR:", error.message);
    return res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

// =====================
// ROOT TEST
// =====================
app.get("/", (req, res) => {
  res.send("SolFort API running 🚀");
});

app.get("/health", (req, res) => {
  res.json({
    ok: true,
    service: "solfort-api",
    uptime: process.uptime()
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
