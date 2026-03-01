const BASE_URL = "https://subradar-production.up.railway.app/api";

// Helper to grab the token from local storage
const getToken = () => localStorage.getItem("token");

// Helper to attach the JWT token to requests
const getAuthHeaders = () => ({
  "Content-Type": "application/json",
  "Authorization": `Bearer ${getToken()}`
});

export const registerUser = async (userData) => {
  // Routes now correctly point to /api/auth/register
  const res = await fetch(`${BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export const loginUser = async (userData) => {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export const verifyOTP = async (data) => {
  const res = await fetch(`${BASE_URL}/auth/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export const getSubscriptions = async () => {
  const res = await fetch(`${BASE_URL}/subscriptions`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export const addSubscription = async (subData) => {
  const res = await fetch(`${BASE_URL}/subscriptions`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(subData),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export const updateSubscription = async (id, subData) => {
  const res = await fetch(`${BASE_URL}/subscriptions/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(subData),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export const deleteSubscription = async (id) => {
  const res = await fetch(`${BASE_URL}/subscriptions/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export const getAnalyticsSummary = async () => {
  const res = await fetch(`${BASE_URL}/analytics/summary`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};