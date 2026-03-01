const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db");
const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

// ⚠️ ONLY YOUR EMAIL (Resend free limitation)
const DEMO_EMAIL = process.env.EMAIL_USER;

// REGISTER
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

    // 🔥 OTP MAIL (DEMO ONLY)
    await resend.emails.send({
      from: "SubRadar <onboarding@resend.dev>",
      to: DEMO_EMAIL,
      subject: "🔐 SubRadar OTP (Demo Mode)",
      html: `
        <h3>OTP for ${email}</h3>
        <h2>${otp}</h2>
        <p>(Sent to demo inbox due to Resend free tier)</p>
      `,
    });

    res.status(201).json({
      message: "OTP sent (check demo email)",
      email,
    });

  } catch (err) {
    console.error("❌ Registration Error:", err);
    res.status(500).json({ message: "Registration failed" });
  }
};

// VERIFY OTP
const verifyOTP = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const [users] = await db.query(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    if (!users.length) {
      return res.status(400).json({ message: "User not found" });
    }

    const user = users[0];

    if (user.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
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

    res.json({ token });

  } catch (err) {
    console.error("❌ Verify Error:", err);
    res.status(500).json({ message: "Verification failed" });
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

    if (!users.length) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const user = users[0];

    if (!user.is_verified) {
      return res.status(403).json({ message: "Verify OTP first" });
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ token });

  } catch (err) {
    console.error("❌ Login Error:", err);
    res.status(500).json({ message: "Login failed" });
  }
};

module.exports = { register, verifyOTP, login };