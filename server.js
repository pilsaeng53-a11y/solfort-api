const express = require("express");
const app = express();

app.use(express.json());

// =====================
// ROUTES IMPORT
// =====================
const coinIconsRoute = require("./routes/coinIcons");
const marketDataRoute = require("./routes/marketData");
const aiSignalsRoute = require("./routes/aiSignals");
const symbolsRoute = require("./routes/symbols");

const userSettingsRoute = require("./routes/userSettings");
const watchlistsRoute = require("./routes/watchlists");
const notificationsRoute = require("./routes/notifications");

const orderlyAccountRoute = require("./routes/orderlyAccount");
const ordersRoute = require("./routes/orders");
const portfolioRoute = require("./routes/portfolio");

// =====================
// ROUTES MOUNT
// =====================
app.use("/coin-icons", coinIconsRoute);
app.use("/market-data", marketDataRoute);
app.use("/ai-signals", aiSignalsRoute);
app.use("/symbols", symbolsRoute);

app.use("/user-settings", userSettingsRoute);
app.use("/watchlists", watchlistsRoute);
app.use("/notifications", notificationsRoute);

app.use("/orderly-account", orderlyAccountRoute);
app.use("/orders", ordersRoute);
app.use("/portfolio", portfolioRoute);

// =====================
// ROOT TEST
// =====================
app.get("/", (req, res) => {
  res.send("SolFort API running 🚀");
});

// =====================
// SERVER START
// =====================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
