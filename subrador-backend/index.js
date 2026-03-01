require("dns").setDefaultResultOrder("ipv4first");
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const startCronJobs = require("./jobs/reminder");

dotenv.config(); // loads your .env file

const app = express();

// Middlewares
app.use(cors());           // allows React (port 3000) to talk to this server
app.use(express.json());   // allows server to read JSON from requests

// Routes (we'll add these soon)
const authRoutes = require("./routes/authRoutes");
const subscriptionRoutes = require("./routes/subscriptionRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/analytics", analyticsRoutes);

// Test route — just to check server is running
app.get("/", (req, res) => {
  res.json({ message: "SubRadar backend is running! 🚀" });
});

const PORT = process.env.PORT || 5000;
// Start the automated email scheduler
startCronJobs();
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});