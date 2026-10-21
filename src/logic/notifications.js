const API = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(
  /\/+$/,
  "",
);
const BASE = `${API}/api/notifications`;

async function request(url, options) {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}

export const getNotifications = (userId) => request(`${BASE}?userId=${userId}`);

export const markNotificationRead = (id) =>
  request(`${BASE}/${id}/read`, { method: "PATCH" });

export const markAllNotificationsRead = (userId) =>
  request(`${BASE}/read-all`, {
    method: "PATCH",
    body: JSON.stringify({ userId }),
  });

export const deleteNotification = (id) =>
  request(`${BASE}/${id}`, { method: "DELETE" });

export const deleteReadNotifications = (userId) =>
  request(`${BASE}/read?userId=${userId}`, { method: "DELETE" });
