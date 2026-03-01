import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { getSubscriptions } from "../api";
import { useAuth } from "../context/AuthContext";

const COLORS = ["#00f0b4", "#a78bfa", "#ff6b9d", "#60a5fa", "#fbbf24", "#f97316", "#34d399", "#06b6d4"];

export default function Analytics() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [subs, setSubs] = useState([]);

  useEffect(() => {
    getSubscriptions().then((data) => setSubs(Array.isArray(data) ? data : []));
  }, []);

  const activeSubs = subs.filter((s) => s.status !== "cancelled");

  // Category breakdown
  const categoryData = activeSubs.reduce((acc, s) => {
    const monthly = s.billing_cycle === "yearly" ? s.amount / 12 : s.billing_cycle === "weekly" ? s.amount * 4 : Number(s.amount);
    const found = acc.find((a) => a.name === s.category);
    if (found) found.value += monthly;
    else acc.push({ name: s.category, value: monthly });
    return acc;
  }, []);

  const totalMonthly = activeSubs.reduce((acc, s) => {
    const monthly = s.billing_cycle === "yearly" ? s.amount / 12 : s.billing_cycle === "weekly" ? s.amount * 4 : Number(s.amount);
    return acc + monthly;
  }, 0);

  // Per-subscription monthly cost bar chart
  const barData = activeSubs.map((s) => ({
    name: s.name.length > 10 ? s.name.slice(0, 10) + "…" : s.name,
    monthly: s.billing_cycle === "yearly" ? Number((s.amount / 12).toFixed(0)) : s.billing_cycle === "weekly" ? s.amount * 4 : Number(s.amount),
  })).sort((a, b) => b.monthly - a.monthly);

  return (
    <div style={page}>
      {/* Sidebar */}
      <div style={sidebar}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 22, color: "#00f0b4" }}>◎</span>
          <span style={{ fontSize: 20, fontWeight: 700, color: "#fff" }}>SubRadar</span>
        </div>

        <nav style={{ marginTop: 40, display: "flex", flexDirection: "column", gap: 6 }}>
          <NavItem icon="⊡" label="Dashboard" onClick={() => navigate("/dashboard")} />
          <NavItem icon="◈" label="Analytics" active onClick={() => navigate("/analytics")} />
        </nav>

        <div style={{ marginTop: "auto", paddingTop: 24, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 13 }}>Logged in as</p>
          <p style={{ color: "#fff", fontSize: 14, fontWeight: 600, marginTop: 2 }}>{user?.name}</p>
          <button onClick={logout} style={logoutBtn}>Sign out</button>
        </div>
      </div>

      {/* Main */}
      <div style={main}>
        <h1 style={{ color: "#fff", fontSize: 24, fontWeight: 700, margin: "0 0 8px" }}>Analytics</h1>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, margin: "0 0 32px" }}>
          Where your money goes every month
        </p>

        {/* Summary Cards */}
        <div style={summaryRow}>
          <SummaryCard label="Monthly Total" value={`₹${totalMonthly.toFixed(0)}`} color="#00f0b4" />
          <SummaryCard label="Yearly Total" value={`₹${(totalMonthly * 12).toFixed(0)}`} color="#a78bfa" />
          <SummaryCard label="Avg Per Sub" value={`₹${activeSubs.length ? (totalMonthly / activeSubs.length).toFixed(0) : 0}`} color="#60a5fa" />
          <SummaryCard label="Most Expensive" value={barData[0]?.name || "—"} color="#fbbf24" />
        </div>

        {/* Charts Row */}
        <div style={chartsRow}>
          {/* Pie Chart */}
          <div style={chartCard}>
            <h3 style={chartTitle}>Spend by Category</h3>
            {categoryData.length === 0 ? (
              <p style={emptyMsg}>No data yet</p>
            ) : (
              <>
                <PieChart width={220} height={220}>
                  <Pie data={categoryData} cx={105} cy={105} innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value">
                    {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                </PieChart>
                <div style={{ marginTop: 16 }}>
                  {categoryData.map((c, i) => (
                    <div key={c.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 10, height: 10, borderRadius: "50%", background: COLORS[i % COLORS.length] }} />
                        <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 13 }}>{c.name}</span>
                      </div>
                      <span style={{ color: "#fff", fontSize: 13, fontWeight: 600 }}>₹{c.value.toFixed(0)}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Bar Chart */}
          <div style={{ ...chartCard, flex: 2 }}>
            <h3 style={chartTitle}>Monthly Cost Per Subscription</h3>
            {barData.length === 0 ? (
              <p style={emptyMsg}>No data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={barData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                  <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: "#0d1f35", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "#fff" }}
                    formatter={(v) => [`₹${v}`, "Monthly"]}
                  />
                  <Bar dataKey="monthly" radius={[6, 6, 0, 0]}>
                    {barData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Subscription Table */}
        <div style={tableCard}>
          <h3 style={chartTitle}>All Subscriptions Breakdown</h3>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Name", "Category", "Amount", "Cycle", "Monthly Cost", "Next Renewal"].map((h) => (
                  <th key={h} style={th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {activeSubs.map((s) => {
                const monthly = s.billing_cycle === "yearly" ? s.amount / 12 : s.billing_cycle === "weekly" ? s.amount * 4 : Number(s.amount);
                return (
                  <tr key={s.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <td style={td}>{s.name}</td>
                    <td style={td}>{s.category}</td>
                    <td style={td}>₹{Number(s.amount).toFixed(0)}</td>
                    <td style={td}>{s.billing_cycle}</td>
                    <td style={{ ...td, color: "#00f0b4", fontWeight: 600 }}>₹{monthly.toFixed(0)}</td>
                    <td style={td}>{s.next_renewal_date?.slice(0, 10) || "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, color }) {
  return (
    <div style={sumCard}>
      <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, margin: 0, textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</p>
      <p style={{ color, fontSize: 26, fontWeight: 700, margin: "8px 0 0", letterSpacing: "-0.5px" }}>{value}</p>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }) {
  return (
    <div onClick={onClick} style={{
      display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
      borderRadius: 10, cursor: "pointer",
      background: active ? "rgba(0,240,180,0.1)" : "transparent",
      color: active ? "#00f0b4" : "rgba(255,255,255,0.5)",
      fontSize: 14, fontWeight: active ? 600 : 400,
      border: active ? "1px solid rgba(0,240,180,0.2)" : "1px solid transparent",
    }}>
      <span style={{ fontSize: 16 }}>{icon}</span> {label}
    </div>
  );
}

const page = { display: "flex", minHeight: "100vh", background: "#050d1a", fontFamily: "'DM Sans', sans-serif" };
const sidebar = {
  width: 220, padding: "28px 20px", background: "rgba(255,255,255,0.02)",
  borderRight: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column",
  position: "sticky", top: 0, height: "100vh",
};
const main = { flex: 1, padding: "36px 40px", overflowY: "auto" };
const logoutBtn = {
  marginTop: 12, background: "transparent", border: "1px solid rgba(255,255,255,0.1)",
  color: "rgba(255,255,255,0.4)", borderRadius: 8, padding: "7px 14px",
  fontSize: 12, cursor: "pointer", width: "100%", fontFamily: "'DM Sans', sans-serif",
};
const summaryRow = { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 };
const sumCard = {
  background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 16, padding: "20px 22px",
};
const chartsRow = { display: "flex", gap: 16, marginBottom: 28, alignItems: "flex-start" };
const chartCard = {
  background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 16, padding: "24px",
};
const chartTitle = { color: "#fff", fontSize: 15, fontWeight: 600, margin: "0 0 20px" };
const emptyMsg = { color: "rgba(255,255,255,0.3)", textAlign: "center", padding: 40 };
const tableCard = {
  background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 16, padding: "24px",
};
const th = { color: "rgba(255,255,255,0.4)", fontSize: 12, textAlign: "left", padding: "8px 12px", textTransform: "uppercase", letterSpacing: "0.5px" };
const td = { color: "rgba(255,255,255,0.7)", fontSize: 14, padding: "12px 12px" };