import { useState, useEffect } from "react";

const CATEGORIES = ["Entertainment", "Music", "Productivity", "News", "Health", "Gaming", "Shopping", "Finance", "Other"];

const POPULAR = [
  { name: "Netflix", category: "Entertainment", amount: 649 },
  { name: "Spotify", category: "Music", amount: 119 },
  { name: "Amazon Prime", category: "Shopping", amount: 299 },
  { name: "YouTube Premium", category: "Entertainment", amount: 129 },
  { name: "Disney+ Hotstar", category: "Entertainment", amount: 299 },
  { name: "Notion", category: "Productivity", amount: 0 },
];

export default function SubscriptionModal({ onClose, onSave, existing }) {
  const [form, setForm] = useState({
    name: "",
    category: "Entertainment",
    amount: "",
    currency: "INR",
    billing_cycle: "monthly",
    next_renewal_date: "",
    notes: "",
    ...existing,
  });

  const handleQuickFill = (sub) => {
    setForm((f) => ({ ...f, name: sub.name, category: sub.category, amount: sub.amount }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <div style={overlay}>
      <div style={modal}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h2 style={{ color: "#fff", fontSize: 20, fontWeight: 700, margin: 0 }}>
            {existing ? "Edit Subscription" : "Add Subscription"}
          </h2>
          <button onClick={onClose} style={closeBtn}>✕</button>
        </div>

        {!existing && (
          <div style={{ marginBottom: 20 }}>
            <p style={smallLabel}>Quick add popular</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {POPULAR.map((s) => (
                <button key={s.name} onClick={() => handleQuickFill(s)} style={chipBtn}>
                  {s.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={row}>
            <div style={col}>
              <label style={smallLabel}>Service Name</label>
              <input style={input} placeholder="e.g. Netflix" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div style={col}>
              <label style={smallLabel}>Category</label>
              <select style={input} value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div style={row}>
            <div style={col}>
              <label style={smallLabel}>Amount</label>
              <input style={input} type="number" placeholder="649" value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
            </div>
            <div style={col}>
              <label style={smallLabel}>Billing Cycle</label>
              <select style={input} value={form.billing_cycle}
                onChange={(e) => setForm({ ...form, billing_cycle: e.target.value })}>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
          </div>

          <div>
            <label style={smallLabel}>Next Renewal Date</label>
            <input style={input} type="date" value={form.next_renewal_date}
              onChange={(e) => setForm({ ...form, next_renewal_date: e.target.value })} required />
          </div>

          <div>
            <label style={smallLabel}>Notes (optional)</label>
            <input style={input} placeholder="e.g. Family plan shared with 3 people" value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>

          <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
            <button type="button" onClick={onClose} style={cancelBtn}>Cancel</button>
            <button type="submit" style={saveBtn}>
              {existing ? "Save Changes" : "Add Subscription"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const overlay = {
  position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
  display: "flex", alignItems: "center", justifyContent: "center",
  zIndex: 1000, backdropFilter: "blur(4px)",
};
const modal = {
  background: "#0d1f35", border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 20, padding: 32, width: "100%", maxWidth: 520,
  fontFamily: "'DM Sans', sans-serif",
};
const closeBtn = {
  background: "rgba(255,255,255,0.08)", border: "none", color: "#fff",
  width: 32, height: 32, borderRadius: 8, cursor: "pointer", fontSize: 14,
};
const smallLabel = { color: "rgba(255,255,255,0.45)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6, display: "block" };
const input = {
  width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 10, padding: "11px 14px", color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box",
};
const row = { display: "flex", gap: 14 };
const col = { flex: 1 };
const chipBtn = {
  background: "rgba(0,240,180,0.08)", border: "1px solid rgba(0,240,180,0.2)",
  color: "#00f0b4", borderRadius: 20, padding: "5px 14px", fontSize: 12,
  cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
};
const cancelBtn = {
  flex: 1, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
  color: "#fff", borderRadius: 10, padding: "12px", fontSize: 14, cursor: "pointer",
};
const saveBtn = {
  flex: 2, background: "#00f0b4", color: "#050d1a", border: "none",
  borderRadius: 10, padding: "12px", fontSize: 14, fontWeight: 700, cursor: "pointer",
};
