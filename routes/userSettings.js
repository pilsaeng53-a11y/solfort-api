const express = require("express");
const { requireAuth } = require("../middleware/requireAuth");
const {
  getUserSettings
} = require("../repositories/userSettingsRepository");

const router = express.Router();

router.get("/", requireAuth, async (req, res) => {
  try {
    const settings = await getUserSettings(req.user.id);
    res.json(settings || {});
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
