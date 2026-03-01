const db = require("../db");

// GET all subscriptions for a logged-in user
const getSubscriptions = async (req, res) => {
  try {
    const [subs] = await db.query("SELECT * FROM subscriptions WHERE user_id = ?", [req.user.id]);
    res.json(subs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error fetching subscriptions" });
  }
};

// POST a new subscription
const addSubscription = async (req, res) => {
  const { name, category, amount, currency, billing_cycle, next_renewal_date, notes } = req.body;
  try {
    const [result] = await db.query(
      "INSERT INTO subscriptions (user_id, name, category, amount, currency, billing_cycle, next_renewal_date, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [req.user.id, name, category, amount, currency, billing_cycle, next_renewal_date, notes]
    );
    
    const [newSub] = await db.query("SELECT * FROM subscriptions WHERE id = ?", [result.insertId]);
    res.status(201).json(newSub[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error adding subscription" });
  }
};

// PUT (Update) a subscription
const updateSubscription = async (req, res) => {
  const subId = req.params.id;
  const { name, category, amount, currency, billing_cycle, next_renewal_date, notes, status } = req.body;
  try {
    const [existing] = await db.query("SELECT * FROM subscriptions WHERE id = ? AND user_id = ?", [subId, req.user.id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: "Subscription not found or unauthorized" });
    }

    await db.query(
      "UPDATE subscriptions SET name=?, category=?, amount=?, currency=?, billing_cycle=?, next_renewal_date=?, notes=?, status=? WHERE id=?",
      [name, category, amount, currency, billing_cycle, next_renewal_date, notes, status || 'active', subId]
    );

    const [updatedSub] = await db.query("SELECT * FROM subscriptions WHERE id = ?", [subId]);
    res.json(updatedSub[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error updating subscription" });
  }
};

// DELETE a subscription
const deleteSubscription = async (req, res) => {
  const subId = req.params.id;
  try {
    const [existing] = await db.query("SELECT * FROM subscriptions WHERE id = ? AND user_id = ?", [subId, req.user.id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: "Subscription not found or unauthorized" });
    }

    await db.query("DELETE FROM subscriptions WHERE id = ?", [subId]);
    res.json({ message: "Subscription deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error deleting subscription" });
  }
};

module.exports = { getSubscriptions, addSubscription, updateSubscription, deleteSubscription };