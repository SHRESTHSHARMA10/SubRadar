const express = require("express");
const router = express.Router();
const { getSubscriptions, addSubscription, updateSubscription, deleteSubscription } = require("../controllers/subscriptionController");
const authMiddleware = require("../middleware/authMiddleware");

// Apply authMiddleware to all routes below to protect them
router.use(authMiddleware);

router.get("/", getSubscriptions);
router.post("/", addSubscription);
router.put("/:id", updateSubscription);
router.delete("/:id", deleteSubscription);

module.exports = router;