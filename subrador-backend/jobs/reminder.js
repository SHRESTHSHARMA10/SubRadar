const cron = require("node-cron");
const nodemailer = require("nodemailer");
const db = require("../db");

// 1. Configure the "Mailman" using your Gmail credentials
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const startCronJobs = () => {
  // 2. The "Alarm Clock" - set to run every day at 8:00 AM ("0 8 * * *")
  // For testing right now, let's make it run every 1 minute: "* * * * *"
  cron.schedule("0 8 * * *", async () => {
    console.log("⏰ Cron job waking up! Checking for subscriptions...");

    try {
      // 3. Ask MySQL: "Find any active subs renewing in exactly 3 days, and give me the user's email too"
      const [renewals] = await db.query(`
        SELECT s.name AS sub_name, s.amount, s.currency, s.next_renewal_date, u.email, u.name AS user_name
        FROM subscriptions s
        JOIN users u ON s.user_id = u.id
        WHERE s.status = 'active'
        AND DATE(s.next_renewal_date) = CURDATE() + INTERVAL 3 DAY
      `);

      if (renewals.length === 0) {
        console.log("No subscriptions renewing in 3 days. Going back to sleep.");
        return;
      }

      // 4. Send an email for every subscription it finds
      for (let item of renewals) {
        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: item.email,
          subject: `🚨 Renewal Alert: ${item.sub_name} is renewing soon!`,
          html: `
            <h3>Hello ${item.user_name},</h3>
            <p>Just a heads up that your <b>${item.sub_name}</b> subscription is set to renew in 3 days.</p>
            <p><b>Amount:</b> ${item.amount} ${item.currency}</p>
            <p>If you don't want to be charged, please remember to cancel it!</p>
            <br/>
            <p>Best,<br/>SubRadar Team</p>
          `
        };

        await transporter.sendMail(mailOptions);
        console.log(`✅ Reminder email successfully sent to ${item.email} for ${item.sub_name}`);
      }
    } catch (err) {
      console.error("❌ Error running cron job:", err);
    }
  });
};

module.exports = startCronJobs;