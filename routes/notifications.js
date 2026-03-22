const express = require("express");
const { requireAuth } = require("../middleware/requireAuth");
const {
  getNotifications
} = require("../repositories/notificationsRepository");

const router = express.Router();

router.get("/", requireAuth, async (req, res) => {
  try {
    const items = await getNotifications(req.user.id);
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
