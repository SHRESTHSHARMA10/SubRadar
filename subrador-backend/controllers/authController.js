const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db");
const { Resend } = require("resend");

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// REGISTER (Step 1: Save user & Send OTP)
const register = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const [existing] = await db.query(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );
    if (existing.length > 0) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await db.query(
      "INSERT INTO users (name, email, password_hash, is_verified, otp) VALUES (?, ?, ?, false, ?)",
      [name, email, password_hash, otp]
    );

    // ✅ Send OTP via Resend (FREE, no domain needed)
    await resend.emails.send({
      from: "SubRadar <onboarding@resend.dev>",
      to: email,
      subject: "🚨 Verify your SubRadar Account",
      html: `
        <h3>Welcome to SubRadar, ${name}!</h3>
        <p>Your 6-digit verification code is:</p>
        <h2>${otp}</h2>
        <p>Enter this code on the verification screen.</p>
      `,
    });

    res.status(201).json({ message: "OTP sent to email", email });

  } catch (err) {
    console.error("❌ Registration Error:", err);
    res.status(500).json({
      message: "Registration failed",
      error: err.message,
    });
  }
};

// VERIFY OTP (Step 2: Check OTP & Give Token)
const verifyOTP = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const [users] = await db.query(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );
    if (users.length === 0) {
      return res.status(400).json({ message: "User not found" });
    }

    const user = users[0];

    if (user.otp !== otp) {
      return res.status(400).json({ message: "Invalid or incorrect OTP" });
    }

    await db.query(
      "UPDATE users SET is_verified = true, otp = NULL WHERE email = ?",
      [email]
    );

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email },
    });

  } catch (err) {
    console.error("❌ Verification Error:", err);
    res.status(500).json({
      message: "Server error during verification",
      error: err.message,
    });
  }
};

// LOGIN
const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const [users] = await db.query(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );
    if (users.length === 0) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const user = users[0];

    if (!user.is_verified) {
      return res.status(403).json({
        message: "Account not verified. Please check your email for the OTP.",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email },
    });

  } catch (err) {
    console.error("❌ Login Error:", err);
    res.status(500).json({
      message: "Login failed",
      error: err.message,
    });
  }
};

module.exports = { register, login, verifyOTP };