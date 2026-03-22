const express = require("express");
const app = express();

app.use(express.json());

// core routes
const coinIconsRoute = require("./routes/coinIcons");
const marketDataRoute = require("./routes/marketData");
const aiSignalsRoute = require("./routes/aiSignals");
const symbolsRoute = require("./routes/symbols");

// safe user routes
const userSettingsRoute = require("./routes/userSettings");
const watchlistsRoute = require("./routes/watchlists");
const notificationsRoute = require("./routes/notifications");

// 3번: orderlyAccount만 추가
const orderlyAccountRoute = require("./routes/orderlyAccount");

app.use("/coin-icons", coinIconsRoute);
app.use("/market-data", marketDataRoute);
app.use("/ai-signals", aiSignalsRoute);
app.use("/symbols", symbolsRoute);

app.use("/user-settings", userSettingsRoute);
app.use("/watchlists", watchlistsRoute);
app.use("/notifications", notificationsRoute);

app.use("/orderly-account", orderlyAccountRoute);

app.get("/", (req, res) => {
  res.send("SolFort API running 🚀");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
