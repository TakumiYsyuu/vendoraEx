const VITE_URL = import.meta.env.VITE_URLL || "http://localhost:5000/api";

function authHeaders() {
  const token = localStorage.getItem("vendora_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function toDisplayStaff(row) {
  return {
    id: row.id,
    name: row.fullname,
    email: row.email,
    restricted: !row.is_active,
  };
}

export async function getAdminStaff() {
  try {
    const response = await fetch(`${VITE_URL}/admin/staff`, {
      headers: authHeaders(),
    });
    const data = await response.json();
    if (!response.ok) return [];
    return data.staff.map(toDisplayStaff);
  } catch (err) {
    console.error("getAdminStaff failed:", err);
    return [];
  }
}

export async function saveAdminStaff({
  name,
  email,
  password,
  existingEmail,
  id,
}) {
  try {
    if (existingEmail) {
      const response = await fetch(`${VITE_URL}/admin/staff/${id}`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ fullname: name }),
      });
      const data = await response.json();
      if (!response.ok)
        return { error: data.message || "Could not update staff." };
      return { success: true };
    }
    const response = await fetch(`${VITE_URL}/admin/staff`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ fullname: name, email, password }),
    });
    const data = await response.json();
    if (!response.ok)
      return { error: data.message || "Could not create staff." };
    return { success: true };
  } catch (err) {
    console.error("saveAdminStaff failed:", err);
    return { error: "Could not reach the server." };
  }
}

export async function setStaffRestriction(id, restricted) {
  try {
    await fetch(`${VITE_URL}/admin/staff/${id}/restriction`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ restricted }),
    });
  } catch (err) {
    console.error("setStaffRestriction failed:", err);
  }
}
