import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getSubscriptions, addSubscription, updateSubscription, deleteSubscription } from "../api";
import { useAuth } from "../context/AuthContext";
import SubscriptionModal from "../components/SubscriptionModal";

const CATEGORY_COLORS = {
  Entertainment: "#ff6b9d",
  Music: "#a78bfa",
  Productivity: "#00f0b4",
  News: "#60a5fa",
  Health: "#34d399",
  Gaming: "#fbbf24",
  Shopping: "#f97316",
  Finance: "#06b6d4",
  Other: "#9ca3af",
};

const CATEGORY_ICONS = {
  Entertainment: "🎬",
  Music: "🎵",
  Productivity: "⚡",
  News: "📰",
  Health: "💊",
  Gaming: "🎮",
  Shopping: "🛍️",
  Finance: "💰",
  Other: "📦",
};

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const diff = new Date(dateStr) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [subs, setSubs] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editSub, setEditSub] = useState(null);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  const fetchSubs = async () => {
    const data = await getSubscriptions();
    setSubs(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => { fetchSubs(); }, []);

  const handleSave = async (form) => {
    if (editSub) {
      await updateSubscription(editSub.id, form);
    } else {
      await addSubscription(form);
    }
    setShowModal(false);
    setEditSub(null);
    fetchSubs();
  };

  const handleDelete = async (id) => {
    if (window.confirm("Remove this subscription?")) {
      await deleteSubscription(id);
      fetchSubs();
    }
  };

  const handleEdit = (sub) => {
    setEditSub(sub);
    setShowModal(true);
  };

  const activeSubs = subs.filter((s) => s.status !== "cancelled");
  const monthlyTotal = activeSubs.reduce((acc, s) => {
    if (s.billing_cycle === "yearly") return acc + s.amount / 12;
    if (s.billing_cycle === "weekly") return acc + s.amount * 4;
    return acc + Number(s.amount);
  }, 0);

  const renewingSoon = activeSubs.filter((s) => {
    const d = daysUntil(s.next_renewal_date);
    return d !== null && d <= 7 && d >= 0;
  });

  const filtered = filter === "all" ? subs : subs.filter((s) => s.category === filter);
  const categories = [...new Set(subs.map((s) => s.category))];

  return (
    <div style={page}>
      {/* Sidebar */}
      <div style={sidebar}>
        <div style={logo}>
          <span style={{ fontSize: 22, color: "#00f0b4" }}>◎</span>
          <span style={{ fontSize: 20, fontWeight: 700, color: "#fff" }}>SubRadar</span>
        </div>

        <nav style={{ marginTop: 40, display: "flex", flexDirection: "column", gap: 6 }}>
          <NavItem icon="⊡" label="Dashboard" active onClick={() => navigate("/dashboard")} />
          <NavItem icon="◈" label="Analytics" onClick={() => navigate("/analytics")} />
        </nav>

        <div style={{ marginTop: "auto", paddingTop: 24, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 13 }}>Logged in as</p>
          <p style={{ color: "#fff", fontSize: 14, fontWeight: 600, marginTop: 2 }}>{user?.name}</p>
          <button onClick={logout} style={logoutBtn}>Sign out</button>
        </div>
      </div>

      {/* Main Content */}
      <div style={main}>
        {/* Header */}
        <div style={header}>
          <div>
            <h1 style={{ color: "#fff", fontSize: 24, fontWeight: 700, margin: 0 }}>
              My Subscriptions
            </h1>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, margin: "4px 0 0" }}>
              {activeSubs.length} active · ₹{monthlyTotal.toFixed(0)}/month
            </p>
          </div>
          <button style={addBtn} onClick={() => { setEditSub(null); setShowModal(true); }}>
            + Add Subscription
          </button>
        </div>

        {/* Stats Row */}
        <div style={statsRow}>
          <StatCard label="Monthly Spend" value={`₹${monthlyTotal.toFixed(0)}`} sub="across all subs" color="#00f0b4" />
          <StatCard label="Yearly Spend" value={`₹${(monthlyTotal * 12).toFixed(0)}`} sub="projected" color="#a78bfa" />
          <StatCard label="Active Subs" value={activeSubs.length} sub="subscriptions" color="#60a5fa" />
          <StatCard label="Renewing Soon" value={renewingSoon.length} sub="within 7 days" color="#fbbf24" alert={renewingSoon.length > 0} />
        </div>

        {/* Renewing Soon Alert */}
        {renewingSoon.length > 0 && (
          <div style={alertBox}>
            <span style={{ fontSize: 16 }}>⚡</span>
            <div>
              <p style={{ margin: 0, color: "#fff", fontWeight: 600, fontSize: 14 }}>Renewals coming up!</p>
              <p style={{ margin: "2px 0 0", color: "rgba(255,255,255,0.5)", fontSize: 13 }}>
                {renewingSoon.map((s) => `${s.name} (${daysUntil(s.next_renewal_date)}d)`).join(" · ")}
              </p>
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        <div style={filterRow}>
          <FilterChip label="All" active={filter === "all"} onClick={() => setFilter("all")} />
          {categories.map((c) => (
            <FilterChip key={c} label={c} active={filter === c} onClick={() => setFilter(c)} />
          ))}
        </div>

        {/* Subscription Cards */}
        {loading ? (
          <p style={{ color: "rgba(255,255,255,0.3)", textAlign: "center", marginTop: 60 }}>Loading...</p>
        ) : filtered.length === 0 ? (
          <div style={emptyState}>
            <p style={{ fontSize: 40 }}>📭</p>
            <p style={{ color: "rgba(255,255,255,0.4)", marginTop: 8 }}>No subscriptions yet. Add one!</p>
          </div>
        ) : (
          <div style={grid}>
            {filtered.map((sub) => (
              <SubCard key={sub.id} sub={sub} onEdit={handleEdit} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <SubscriptionModal
          existing={editSub}
          onClose={() => { setShowModal(false); setEditSub(null); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

function SubCard({ sub, onEdit, onDelete }) {
  const days = daysUntil(sub.next_renewal_date);
  const color = CATEGORY_COLORS[sub.category] || "#9ca3af";
  const icon = CATEGORY_ICONS[sub.category] || "📦";
  const isCancelled = sub.status === "cancelled";

  return (
    <div style={{ ...card, opacity: isCancelled ? 0.5 : 1 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ ...iconBox, background: color + "20", border: `1px solid ${color}40` }}>
            {icon}
          </div>
          <div>
            <p style={{ color: "#fff", fontWeight: 600, margin: 0, fontSize: 15 }}>{sub.name}</p>
            <span style={{ ...categoryBadge, color, borderColor: color + "40", background: color + "15" }}>
              {sub.category}
            </span>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ color: "#fff", fontWeight: 700, fontSize: 17, margin: 0 }}>
            ₹{Number(sub.amount).toFixed(0)}
          </p>
          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, margin: "2px 0 0" }}>
            /{sub.billing_cycle}
          </p>
        </div>
      </div>

      <div style={{ marginTop: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          {days !== null && !isCancelled && (
            <span style={{
              fontSize: 12, padding: "4px 10px", borderRadius: 20,
              background: days <= 3 ? "rgba(255,107,107,0.15)" : "rgba(255,255,255,0.06)",
              color: days <= 3 ? "#ff6b6b" : "rgba(255,255,255,0.4)",
              border: `1px solid ${days <= 3 ? "rgba(255,107,107,0.3)" : "rgba(255,255,255,0.08)"}`,
            }}>
              {days === 0 ? "Renews today!" : days < 0 ? "Overdue" : `Renews in ${days}d`}
            </span>
          )}
          {isCancelled && <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>Cancelled</span>}
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={() => onEdit(sub)} style={actionBtn}>Edit</button>
          <button onClick={() => onDelete(sub.id)} style={{ ...actionBtn, color: "#ff6b6b", borderColor: "rgba(255,107,107,0.3)" }}>
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, color, alert }) {
  return (
    <div style={{ ...statCard, borderColor: alert ? "rgba(251,191,36,0.3)" : "rgba(255,255,255,0.08)" }}>
      <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, margin: 0, textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</p>
      <p style={{ color, fontSize: 28, fontWeight: 700, margin: "8px 0 4px", letterSpacing: "-0.5px" }}>{value}</p>
      <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, margin: 0 }}>{sub}</p>
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

function FilterChip({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      background: active ? "rgba(0,240,180,0.12)" : "rgba(255,255,255,0.05)",
      border: `1px solid ${active ? "rgba(0,240,180,0.3)" : "rgba(255,255,255,0.08)"}`,
      color: active ? "#00f0b4" : "rgba(255,255,255,0.5)",
      borderRadius: 20, padding: "6px 16px", fontSize: 13, cursor: "pointer",
      fontFamily: "'DM Sans', sans-serif",
    }}>
      {label}
    </button>
  );
}

const page = { display: "flex", minHeight: "100vh", background: "#050d1a", fontFamily: "'DM Sans', sans-serif" };
const sidebar = {
  width: 220, padding: "28px 20px", background: "rgba(255,255,255,0.02)",
  borderRight: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column",
  position: "sticky", top: 0, height: "100vh",
};
const logo = { display: "flex", alignItems: "center", gap: 10 };
const main = { flex: 1, padding: "36px 40px", overflowY: "auto" };
const header = { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 };
const statsRow = { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 };
const statCard = {
  background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 16, padding: "20px 22px",
};
const grid = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16, marginTop: 20 };
const card = {
  background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 16, padding: "20px 22px", transition: "border 0.2s",
};
const iconBox = { width: 42, height: 42, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 };
const categoryBadge = { fontSize: 11, border: "1px solid", borderRadius: 20, padding: "2px 10px", letterSpacing: "0.3px" };
const actionBtn = {
  background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
  color: "rgba(255,255,255,0.5)", borderRadius: 8, padding: "5px 12px",
  fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
};
const addBtn = {
  background: "#00f0b4", color: "#050d1a", border: "none", borderRadius: 10,
  padding: "11px 20px", fontSize: 14, fontWeight: 700, cursor: "pointer",
};
const logoutBtn = {
  marginTop: 12, background: "transparent", border: "1px solid rgba(255,255,255,0.1)",
  color: "rgba(255,255,255,0.4)", borderRadius: 8, padding: "7px 14px",
  fontSize: 12, cursor: "pointer", width: "100%", fontFamily: "'DM Sans', sans-serif",
};
const filterRow = { display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 };
const alertBox = {
  display: "flex", gap: 14, alignItems: "center",
  background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)",
  borderRadius: 12, padding: "14px 18px", marginBottom: 20,
};
const emptyState = { textAlign: "center", marginTop: 80 };