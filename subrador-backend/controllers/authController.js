// const bcrypt = require("bcryptjs");
// const jwt = require("jsonwebtoken");
// const db = require("../db");

// // REGISTER
// const register = async (req, res) => {
//   const { name, email, password } = req.body;
//   try {
//     const [existing] = await db.query("SELECT id FROM users WHERE email = ?", [email]);
//     if (existing.length > 0) {
//       return res.status(400).json({ message: "Email already registered" });
//     }

//     const password_hash = await bcrypt.hash(password, 10);

//     const [result] = await db.query(
//       "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
//       [name, email, password_hash]
//     );

//     const token = jwt.sign(
//       { id: result.insertId, email },
//       process.env.JWT_SECRET,
//       { expiresIn: "7d" }
//     );

//     res.status(201).json({
//       token,
//       user: { id: result.insertId, name, email }
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Server error" });
//   }
// };

// // LOGIN
// const login = async (req, res) => {
//   const { email, password } = req.body;
//   try {
//     const [users] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
//     if (users.length === 0) {
//       return res.status(400).json({ message: "Invalid email or password" });
//     }

//     const user = users[0];
//     const isMatch = await bcrypt.compare(password, user.password_hash);
//     if (!isMatch) {
//       return res.status(400).json({ message: "Invalid email or password" });
//     }

//     const token = jwt.sign(
//       { id: user.id, email: user.email },
//       process.env.JWT_SECRET,
//       { expiresIn: "7d" }
//     );

//     res.json({
//       token,
//       user: { id: user.id, name: user.name, email: user.email }
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Server error" });
//   }
// };

// module.exports = { register, login };
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db");
const nodemailer = require("nodemailer");

// Setup the Mailman using your existing .env variables
const transporter = nodemailer.createTransport({
  service: "gmail",
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
    
    // Generate a random 6-digit OTP
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

    // Don't send token yet, just send success message
    res.status(201).json({ message: "OTP sent to email", email });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
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

    // OTP matches! Update database to verified and clear the OTP
    await db.query("UPDATE users SET is_verified = true, otp = NULL WHERE email = ?", [email]);

    // Now generate the JWT token and log them in
    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// LOGIN
const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const [users] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
    if (users.length === 0) return res.status(400).json({ message: "Invalid email or password" });

    const user = users[0];

    // BLOCK unverified users
    if (!user.is_verified) {
      return res.status(403).json({ message: "Account not verified. Please check your email for the OTP." });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return res.status(400).json({ message: "Invalid email or password" });

    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { register, login, verifyOTP };