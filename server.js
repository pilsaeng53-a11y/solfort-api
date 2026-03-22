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
// ROOT TEST
// =====================
app.get("/", (req, res) => {
  res.send("SolFort API running 🚀");
});

// =====================
// HEALTH CHECK
// =====================
app.get("/health", (req, res) => {
  res.json({
    ok: true,
    service: "solfort-api",
    uptime: process.uptime()
  });
});

// =====================
// SERVER START
// =====================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
