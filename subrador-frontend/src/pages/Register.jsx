/*

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerUser } from "../api";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await registerUser(form);
    setLoading(false);
    if (res.token) {
      login(res.user, res.token);
      navigate("/dashboard");
    } else {
      setError(res.message || "Registration failed");
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
        <p style={styles.tagline}>Create your account and start saving money.</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>Full Name</label>
          <input style={styles.input} placeholder="John Doe" value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })} required />

          <label style={styles.label}>Email</label>
          <input style={styles.input} type="email" placeholder="you@email.com" value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })} required />

          <label style={styles.label}>Password</label>
          <input style={styles.input} type="password" placeholder="min 6 characters" value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })} required />

          {error && <p style={styles.error}>{error}</p>}

          <button style={styles.btn} type="submit" disabled={loading}>
            {loading ? "Creating account..." : "Create Account →"}
          </button>
        </form>

        <p style={styles.switchText}>
          Already have an account?{" "}
          <Link to="/login" style={styles.link}>Login</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", background: "#050d1a", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif", position: "relative", overflow: "hidden" },
  glowBg: { position: "absolute", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,240,180,0.07) 0%, transparent 70%)", top: "10%", left: "30%", pointerEvents: "none" },
  card: { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: "48px 40px", width: "100%", maxWidth: 420, backdropFilter: "blur(12px)", position: "relative", zIndex: 1 },
  logo: { display: "flex", alignItems: "center", gap: 10, marginBottom: 8 },
  logoIcon: { fontSize: 28, color: "#00f0b4" },
  logoText: { fontSize: 26, fontWeight: 700, color: "#fff", letterSpacing: "-0.5px" },
  tagline: { color: "rgba(255,255,255,0.4)", fontSize: 13, marginBottom: 36, lineHeight: 1.6 },
  form: { display: "flex", flexDirection: "column", gap: 6 },
  label: { color: "rgba(255,255,255,0.5)", fontSize: 12, letterSpacing: "0.5px", textTransform: "uppercase", marginTop: 12 },
  input: { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "12px 16px", color: "#fff", fontSize: 14, outline: "none" },
  btn: { marginTop: 24, background: "#00f0b4", color: "#050d1a", border: "none", borderRadius: 10, padding: "14px 24px", fontSize: 15, fontWeight: 700, cursor: "pointer" },
  error: { color: "#ff6b6b", fontSize: 13, marginTop: 4 },
  switchText: { color: "rgba(255,255,255,0.35)", fontSize: 13, textAlign: "center", marginTop: 28 },
  link: { color: "#00f0b4", fontWeight: 600, textDecoration: "none" },
};

*/




import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerUser, verifyOTP } from "../api"; // Make sure verifyOTP is here!
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();
  
  // State
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [step, setStep] = useState(1); // 1 = Register, 2 = OTP
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Step 1: Send User Data & Get OTP
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await registerUser(form);
      setLoading(false);
      setStep(2); // If successful, move to OTP step
    } catch (err) {
      setLoading(false);
      try {
        setError(JSON.parse(err.message).message);
      } catch {
        setError("Registration failed");
      }
    }
  };

  // Step 2: Verify OTP & Login
  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      // Send the email from the form state and the OTP they typed
      const res = await verifyOTP({ email: form.email, otp });
      setLoading(false);
      
      if (res.token) {
        login(res.user, res.token);
        navigate("/dashboard");
      }
    } catch (err) {
      setLoading(false);
      try {
        setError(JSON.parse(err.message).message);
      } catch {
        setError("Invalid OTP");
      }
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
            <input style={styles.input} placeholder="John Doe" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })} required />

            <label style={styles.label}>Email</label>
            <input style={styles.input} type="email" placeholder="you@email.com" value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })} required />

            <label style={styles.label}>Password</label>
            <input style={styles.input} type="password" placeholder="min 6 characters" value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })} required />

            {error && <p style={styles.error}>{error}</p>}

            <button style={styles.btn} type="submit" disabled={loading}>
              {loading ? "Creating account..." : "Create Account →"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifySubmit} style={styles.form}>
            <label style={styles.label}>Verification Code</label>
            <input 
              style={{...styles.input, textAlign: 'center', letterSpacing: '4px', fontSize: '20px'}} 
              placeholder="000000" 
              maxLength="6"
              value={otp}
              onChange={(e) => setOtp(e.target.value)} 
              required 
            />

            {error && <p style={styles.error}>{error}</p>}

            <button style={styles.btn} type="submit" disabled={loading}>
              {loading ? "Verifying..." : "Verify & Enter →"}
            </button>
          </form>
        )}

        {step === 1 && (
          <p style={styles.switchText}>
            Already have an account?{" "}
            <Link to="/login" style={styles.link}>Login</Link>
          </p>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", background: "#050d1a", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif", position: "relative", overflow: "hidden" },
  glowBg: { position: "absolute", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,240,180,0.07) 0%, transparent 70%)", top: "10%", left: "30%", pointerEvents: "none" },
  card: { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: "48px 40px", width: "100%", maxWidth: 420, backdropFilter: "blur(12px)", position: "relative", zIndex: 1 },
  logo: { display: "flex", alignItems: "center", gap: 10, marginBottom: 8 },
  logoIcon: { fontSize: 28, color: "#00f0b4" },
  logoText: { fontSize: 26, fontWeight: 700, color: "#fff", letterSpacing: "-0.5px" },
  tagline: { color: "rgba(255,255,255,0.4)", fontSize: 13, marginBottom: 36, lineHeight: 1.6 },
  form: { display: "flex", flexDirection: "column", gap: 6 },
  label: { color: "rgba(255,255,255,0.5)", fontSize: 12, letterSpacing: "0.5px", textTransform: "uppercase", marginTop: 12 },
  input: { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "12px 16px", color: "#fff", fontSize: 14, outline: "none" },
  btn: { marginTop: 24, background: "#00f0b4", color: "#050d1a", border: "none", borderRadius: 10, padding: "14px 24px", fontSize: 15, fontWeight: 700, cursor: "pointer" },
  error: { color: "#ff6b6b", fontSize: 13, marginTop: 4 },
  switchText: { color: "rgba(255,255,255,0.35)", fontSize: 13, textAlign: "center", marginTop: 28 },
  link: { color: "#00f0b4", fontWeight: 600, textDecoration: "none" },
};
  


