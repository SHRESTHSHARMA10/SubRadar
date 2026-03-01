const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db");
const nodemailer = require("nodemailer");

// Updated Transporter with Cloud-Ready Timeouts
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587, 
  secure: false, 
  requireTLS: true, 
  connectionTimeout: 10000, // 10 seconds to establish connection
  greetingTimeout: 5000,    // 5 seconds to wait for Gmail's hello
  socketTimeout: 10000,     // 10 seconds for data transfer
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// REGISTER (Step 1: Save user & Send OTP)
const register = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const [existing] = await db.query("SELECT id FROM users WHERE email = ?", [email]);
    if (existing.length > 0) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const password_hash = await bcrypt.hash(password, 10);
    
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const [result] = await db.query(
      "INSERT INTO users (name, email, password_hash, is_verified, otp) VALUES (?, ?, ?, false, ?)",
      [name, email, password_hash, otp]
    );

    // Send the OTP via Email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "🚨 Verify your SubRadar Account",
      html: `<h3>Welcome to SubRadar, ${name}!</h3>
             <p>Your 6-digit verification code is: <b style="font-size: 20px;">${otp}</b></p>
             <p>Enter this code on the registration page to activate your account.</p>`
    });

    res.status(201).json({ message: "OTP sent to email", email });
  } catch (err) {
    console.error("❌ Registration Error:", err);
    // This stops the frontend spinner and shows the real error
    res.status(500).json({ 
      message: "Registration failed. Email service might be down.", 
      error: err.message 
    });
  }
};

// VERIFY OTP (Step 2: Check OTP & Give Token)
const verifyOTP = async (req, res) => {
  const { email, otp } = req.body;
  try {
    const [users] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
    if (users.length === 0) return res.status(400).json({ message: "User not found" });

    const user = users[0];
    
    if (user.otp !== otp) {
      return res.status(400).json({ message: "Invalid or incorrect OTP" });
    }

    await db.query("UPDATE users SET is_verified = true, otp = NULL WHERE email = ?", [email]);

    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    console.error("❌ Verification Error:", err);
    res.status(500).json({ message: "Server error during verification", error: err.message });
  }
};

// LOGIN
const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const [users] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
    if (users.length === 0) return res.status(400).json({ message: "Invalid email or password" });

    const user = users[0];

    if (!user.is_verified) {
      return res.status(403).json({ message: "Account not verified. Please check your email for the OTP." });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return res.status(400).json({ message: "Invalid email or password" });

    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    console.error("❌ Login Error:", err);
    res.status(500).json({ message: "Login failed. Server error.", error: err.message });
  }
};

module.exports = { register, login, verifyOTP };