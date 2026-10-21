const BASE = (import.meta.env.VITE_URL || "http://localhost:5000/api").replace(
  /\/+$/,
  "",
);
const NOTIFICATIONS = `${BASE}/notifications`;

async function request(url, options) {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}

export const getNotifications = (userId) =>
  request(`${NOTIFICATIONS}?userId=${userId}`);

export const markNotificationRead = (id) =>
  request(`${NOTIFICATIONS}/${id}/read`, { method: "PATCH" });

export const markAllNotificationsRead = (userId) =>
  request(`${NOTIFICATIONS}/read-all`, {
    method: "PATCH",
    body: JSON.stringify({ userId }),
  });

export const deleteNotification = (id) =>
  request(`${NOTIFICATIONS}/${id}`, { method: "DELETE" });

export const deleteReadNotifications = (userId) =>
  request(`${NOTIFICATIONS}/read?userId=${userId}`, { method: "DELETE" });
