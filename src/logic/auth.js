const VITE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const STORAGE_KEY = "vendora_user";
const TOKEN_KEY = "vendora_token";

function normalizeUser(rawUser) {
  if (!rawUser) return rawUser;
  return {
    ...rawUser,
    name: rawUser.name || rawUser.fullname || rawUser.full_name || "",
    phone: rawUser.phone || rawUser.phone_num || "",
  };
}

export async function loginAccount({ email, password }) {
  try {
    const response = await fetch(`${VITE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { error: data.message || "Login failed. Please try again." };
    }

    localStorage.setItem("vendora_token", data.token);
    return { account: normalizeUser(data.user) };
  } catch (err) {
    console.error("Login request failed:", err);
    return { error: "Could not reach the server. Please try again." };
  }
}

export async function registerAccount({
  name,
  email,
  phone,
  password,
  accountType,
}) {
  try {
    const response = await fetch(`${VITE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullname: name,
        email,
        phone_num: phone,
        password,
        role: accountType,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        error: data.message || "Registration failed. Please try again.",
      };
    }

    if (data.token) {
      localStorage.setItem("vendora_token", data.token);
    }
    return { account: normalizeUser(data.user) };
  } catch (err) {
    console.error("Register request failed:", err);
    return { error: "Could not reach the server. Please try again." };
  }
}

// --- Session persistence, matching App.jsx's exact call signatures ---

export function loadStoredUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.error("Failed to load stored user:", err);
    return null;
  }
}

export function persistLogin(nextUser, remember) {
  if (remember) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
    } catch (err) {
      console.error("Failed to persist login:", err);
    }
  }
  return nextUser;
}

export function persistUserUpdate(user, nextUser) {
  const updated = { ...user, ...nextUser };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error("Failed to persist user update:", err);
  }
  return updated;
}

export function clearStoredUser() {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(TOKEN_KEY);
}
