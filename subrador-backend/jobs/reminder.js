const cron = require("node-cron");
const db = require("../db");
const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

const startCronJobs = () => {
  cron.schedule("0 8 * * *", async () => {
    try {
      const [rows] = await db.query(`
        SELECT s.name, s.amount, s.currency, u.email
        FROM subscriptions s
        JOIN users u ON s.user_id = u.id
        WHERE s.status='active'
        AND DATE(s.next_renewal_date) = CURDATE() + INTERVAL 3 DAY
      `);

      for (let r of rows) {
        await resend.emails.send({
          from: "SubRadar <alerts@resend.dev>",
          to: r.email,   // ✅ USERS WILL RECEIVE THIS
          subject: `⏰ ${r.name} renewing soon`,
          html: `
            <p>Your ${r.name} subscription renews in 3 days.</p>
            <p>Amount: ${r.amount} ${r.currency}</p>
          `,
        });
      }

    } catch (err) {
      console.error("❌ Cron error:", err);
    }
  });
};

module.exports = startCronJobs;