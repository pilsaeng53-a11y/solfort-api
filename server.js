const express = require("express");
const app = express();

app.use(express.json());

const coinIconsRoute = require("./routes/coinIcons");
const marketDataRoute = require("./routes/marketData");
const aiSignalsRoute = require("./routes/aiSignals");
const symbolsRoute = require("./routes/symbols");
const userSettingsRoute = require("./routes/userSettings");

app.use("/coin-icons", coinIconsRoute);
app.use("/market-data", marketDataRoute);
app.use("/ai-signals", aiSignalsRoute);
app.use("/symbols", symbolsRoute);
app.use("/user-settings", userSettingsRoute);

app.get("/", (req, res) => {
  res.send("SolFort API running 🚀");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
