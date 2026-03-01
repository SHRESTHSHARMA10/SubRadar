const db = require("../db");

const getSummary = async (req, res) => {
  try {
    // Fetch all active subscriptions for this specific user
    const [subs] = await db.query(
      "SELECT * FROM subscriptions WHERE user_id = ? AND status = 'active'", 
      [req.user.id]
    );

    let monthlyTotal = 0;
    let yearlyTotal = 0;

    // Loop through each sub to calculate normalized costs
    subs.forEach(sub => {
      let amount = parseFloat(sub.amount);
      
      if (sub.billing_cycle === 'monthly') {
        monthlyTotal += amount;
        yearlyTotal += (amount * 12);
      } else if (sub.billing_cycle === 'yearly') {
        monthlyTotal += (amount / 12);
        yearlyTotal += amount;
      } else if (sub.billing_cycle === 'weekly') {
        monthlyTotal += (amount * 4.33); // roughly 4.33 weeks in a month
        yearlyTotal += (amount * 52);
      }
    });

    // Send the calculated stats back to the frontend
    res.json({
      totalActive: subs.length,
      monthlySpend: monthlyTotal.toFixed(2),
      yearlySpend: yearlyTotal.toFixed(2)
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error fetching analytics" });
  }
};

module.exports = { getSummary };