const express = require("express");
const router = express.Router();
const { getSummary } = require("../controllers/analyticsController");
const authMiddleware = require("../middleware/authMiddleware");

// Protect analytics routes so only logged-in users can see their stats
router.use(authMiddleware);

router.get("/summary", getSummary);

module.exports = router;