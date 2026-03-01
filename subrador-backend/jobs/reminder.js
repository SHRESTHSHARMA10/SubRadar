const cron = require("node-cron");
const db = require("../db");
const { Resend } = require("resend");

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

const startCronJobs = () => {
  // Runs every day at 8:00 AM
  cron.schedule("0 8 * * *", async () => {
    console.log("⏰ Cron job waking up! Checking for subscriptions...");

    try {
      const [renewals] = await db.query(`
        SELECT 
          s.name AS sub_name, 
          s.amount, 
          s.currency, 
          s.next_renewal_date, 
          u.email, 
          u.name AS user_name
        FROM subscriptions s
        JOIN users u ON s.user_id = u.id
        WHERE s.status = 'active'
        AND DATE(s.next_renewal_date) = CURDATE() + INTERVAL 3 DAY
      `);

      if (renewals.length === 0) {
        console.log("No subscriptions renewing in 3 days. Going back to sleep.");
        return;
      }

      for (let item of renewals) {
        await resend.emails.send({
          from: "SubRadar <onboarding@resend.dev>",
          to: item.email,
          subject: `🚨 Renewal Alert: ${item.sub_name} is renewing soon!`,
          html: `
            <h3>Hello ${item.user_name},</h3>
            <p>Just a heads up that your <b>${item.sub_name}</b> subscription is set to renew in 3 days.</p>
            <p><b>Amount:</b> ${item.amount} ${item.currency}</p>
            <p>If you don't want to be charged, please remember to cancel it!</p>
            <br/>
            <p>Best,<br/>SubRadar Team</p>
          `,
        });

        console.log(`✅ Reminder email sent to ${item.email} for ${item.sub_name}`);
      }
    } catch (err) {
      console.error("❌ Error running cron job:", err);
    }
  });
};

module.exports = startCronJobs;