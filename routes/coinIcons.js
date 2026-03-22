const express = require("express");
const { loadIconMap } = require("../services/coinIconService");

const router = express.Router();

router.get("/", (req, res) => {
  try {
    const iconMap = loadIconMap();
    res.json(iconMap);
  } catch (error) {
    res.status(500).json({ error: "Failed to load icon map" });
  }
});

module.exports = router;
