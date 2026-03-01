import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerUser, verifyOTP } from "../api";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [step, setStep] = useState(1); // 1 = Register, 2 = OTP
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // STEP 1 — REGISTER
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await registerUser(form);
      setStep(2);
    } catch (err) {
      setError("Registration failed");
    } finally {
      setLoading(false);
    }
  };

  // STEP 2 — VERIFY OTP
  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await verifyOTP({
        email: form.email,
        otp,
      });

      // 🔑 CRITICAL FIX
      localStorage.setItem("token", res.token);

      // update auth context
      login(res.user, res.token);

      // give React a tick to update context
      setTimeout(() => {
        navigate("/dashboard");
      }, 0);

    } catch (err) {
      setError("Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.glowBg} />
      <div style={styles.card}>
        <div style={styles.logo}>
          <span style={styles.logoIcon}>◎</span>
          <span style={styles.logoText}>SubRadar</span>
        </div>

        <p style={styles.tagline}>
          {step === 1
            ? "Create your account and start saving money."
            : `We sent a 6-digit code to ${form.email}`}
        </p>

        {step === 1 ? (
          <form onSubmit={handleRegisterSubmit} style={styles.form}>
            <label style={styles.label}>Full Name</label>
            <input
              style={styles.input}
              value={form.name}
              onChange={(e) =>
                setForm({ ...form, name: e.target.value })
              }
              required
            />

            <label style={styles.label}>Email</label>
            <input
              style={styles.input}
              type="email"
              value={form.email}
              onChange={(e) =>
                setForm({ ...form, email: e.target.value })
              }
              required
            />

            <label style={styles.label}>Password</label>
            <input
              style={styles.input}
              type="password"
              value={form.password}
              onChange={(e) =>
                setForm({ ...form, password: e.target.value })
              }
              required
            />

            {error && <p style={styles.error}>{error}</p>}

            <button style={styles.btn} disabled={loading}>
              {loading ? "Creating..." : "Create Account →"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifySubmit} style={styles.form}>
            <label style={styles.label}>Verification Code</label>
            <input
              style={{
                ...styles.input,
                textAlign: "center",
                letterSpacing: "4px",
                fontSize: "20px",
              }}
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              maxLength={6}
              required
            />

            {error && <p style={styles.error}>{error}</p>}

            <button style={styles.btn} disabled={loading}>
              {loading ? "Verifying..." : "Verify & Enter →"}
            </button>
          </form>
        )}

        {step === 1 && (
          <p style={styles.switchText}>
            Already have an account?{" "}
            <Link to="/login" style={styles.link}>
              Login
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#050d1a",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'DM Sans', sans-serif",
    position: "relative",
  },
  glowBg: {
    position: "absolute",
    width: 500,
    height: 500,
    borderRadius: "50%",
    background:
      "radial-gradient(circle, rgba(0,240,180,0.07) 0%, transparent 70%)",
  },
  card: {
    background: "rgba(255,255,255,0.04)",
    borderRadius: 20,
    padding: 40,
    width: "100%",
    maxWidth: 420,
  },
  logo: { display: "flex", gap: 10 },
  logoIcon: { color: "#00f0b4", fontSize: 28 },
  logoText: { color: "#fff", fontSize: 26 },
  tagline: { color: "rgba(255,255,255,0.4)", marginBottom: 30 },
  form: { display: "flex", flexDirection: "column" },
  label: { color: "rgba(255,255,255,0.6)", fontSize: 12 },
  input: {
    background: "rgba(255,255,255,0.06)",
    border: "none",
    padding: 12,
    color: "#fff",
    borderRadius: 8,
  },
  btn: {
    marginTop: 20,
    background: "#00f0b4",
    border: "none",
    padding: 14,
    borderRadius: 8,
    fontWeight: 700,
  },
  error: { color: "#ff6b6b", marginTop: 8 },
  switchText: { marginTop: 24, textAlign: "center" },
  link: { color: "#00f0b4" },
};