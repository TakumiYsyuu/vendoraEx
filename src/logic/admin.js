import { getSellers } from "./moderation";
import { fetchStorefrontProducts } from "./products";

const VITE_URL = import.meta.env.VITE_URL || "http://localhost:5000/api";

function authHeaders() {
  const token = localStorage.getItem("vendora_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function toDisplayUser(row) {
  return {
    id: row.id,
    name: row.fullname,
    email: row.email,
    phone: row.phone_num,
    type: row.role === "seller" ? "Seller" : "Buyer",
    restricted: !!row.is_restricted,
    restrictionReason: row.restriction_reason,
    restrictionStart: row.restriction_start,
    restrictionEnd: row.restriction_end,
  };
}

export async function getAdminUsers() {
  try {
    const response = await fetch(`${VITE_URL}/admin/users`, {
      cache: "no-store",
      headers: authHeaders(),
    });
    const data = await response.json();
    if (!response.ok) return [];
    return data.users.map(toDisplayUser);
  } catch (err) {
    console.error("getAdminUsers failed:", err);
    return [];
  }
}

export async function saveAdminUser({
  name,
  email,
  phone,
  accountType,
  password,
  existingEmail,
  id,
}) {
  const role = accountType === "Seller" ? "seller" : "shopper";
  try {
    if (existingEmail) {
      const response = await fetch(`${VITE_URL}/admin/users/${id}`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ fullname: name, role }),
      });
      const data = await response.json();
      if (!response.ok)
        return { error: data.message || "Could not update user." };
      return { success: true };
    }
    const response = await fetch(`${VITE_URL}/admin/users`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ fullname: name, email, phone, password, role }),
    });
    const data = await response.json();
    if (!response.ok)
      return { error: data.message || "Could not create user." };
    return { success: true };
  } catch (err) {
    console.error("saveAdminUser failed:", err);
    return { error: "Could not reach the server." };
  }
}

// restricted = true  -> details: { reason, startDate, endDate }
// restricted = false -> lifts the restriction
export async function setUserRestriction(id, restricted, details = {}) {
  try {
    const response = await fetch(`${VITE_URL}/admin/users/${id}/restriction`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ restricted, ...details }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok)
      return { error: data.message || "Could not update restriction." };
    return { success: true };
  } catch (err) {
    console.error("setUserRestriction failed:", err);
    return { error: "Could not reach the server." };
  }
}

function readList(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    if (Array.isArray(value)) return value;
  } catch {
    // A backend version would return a recoverable data error here.
  }
  return [];
}

const defaultAdminSettings = {
  platformName: "Vendora",
  supportEmail: "support@vendora.com",
  marketplaceNotice: "Welcome to Vendora Marketplace.",
};

export function getAdminSettings() {
  try {
    const stored = JSON.parse(
      localStorage.getItem("vendora-admin-settings") || "null",
    );
    if (stored && typeof stored === "object")
      return { ...defaultAdminSettings, ...stored };
  } catch {
    // A backend implementation would return a recoverable settings error here.
  }
  return { ...defaultAdminSettings };
}

export function saveAdminSettings(settings) {
  const platformName = settings.platformName.trim();
  const supportEmail = settings.supportEmail.trim().toLowerCase();
  const marketplaceNotice = settings.marketplaceNotice.trim();
  if (!platformName) return { error: "Enter a platform name." };
  if (!/^\S+@\S+\.\S+$/.test(supportEmail))
    return { error: "Enter a valid support email." };
  if (!marketplaceNotice) return { error: "Enter a marketplace notice." };
  const nextSettings = { platformName, supportEmail, marketplaceNotice };
  localStorage.setItem("vendora-admin-settings", JSON.stringify(nextSettings));
  return { settings: nextSettings };
}

function getTodayLabel() {
  return new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function getAdminOrders() {
  return Object.keys(localStorage)
    .filter((key) => key.startsWith("vendora-orders-"))
    .flatMap((key) => readList(key))
    .filter(
      (order, index, orders) =>
        orders.findIndex((item) => item.id === order.id) === index,
    );
}

export async function getAdminProducts() {
  try {
    return await fetchStorefrontProducts();
  } catch (err) {
    console.error(err);
    return [];
  }
}

// Produces analytics directly from the marketplace records currently saved in local storage.
// Pass the users list in (from getAdminUsers) because that call is async.
export function getAdminAnalytics(reports, users = []) {
  const orders = getAdminOrders();
  const currentYear = new Date().getFullYear();
  const monthlyOrders = Array.from({ length: 12 }, (_, month) => ({
    label: new Date(currentYear, month, 1).toLocaleDateString("en-US", {
      month: "short",
    }),
    value: 0,
  }));

  orders.forEach((order) => {
    const orderDate = new Date(order.date);
    if (
      !Number.isNaN(orderDate.valueOf()) &&
      orderDate.getFullYear() === currentYear
    ) {
      monthlyOrders[orderDate.getMonth()].value += 1;
    }
  });

  const buyerCount = users.filter((user) => user.type === "Buyer").length;
  const orderCount = orders.length;
  return {
    grossSales: orders
      .filter((order) => order.status !== "Cancelled")
      .reduce((total, order) => total + Number(order.total || 0), 0),
    orderCount,
    conversion: buyerCount ? (orderCount / buyerCount) * 100 : 0,
    supportTickets: reports.filter((report) =>
      ["Pending", "Submitted to Admin"].includes(report.status),
    ).length,
    monthlyOrders,
  };
}

// totalUsers is filled in by AdminModeration from the loaded users list
export function getAdminStats(reports) {
  const sellers = getSellers();
  const orders = getAdminOrders();
  const pendingReviews = reports.filter((report) =>
    ["Pending", "Submitted to Admin"].includes(report.status),
  );
  return {
    totalUsers: 0,
    activeSellers: sellers.filter(
      (seller) =>
        localStorage.getItem(`vendora-banned-${seller.email}`) !== "true",
    ).length,
    ordersToday: orders.filter((order) => order.date === getTodayLabel())
      .length,
    pendingReviews: pendingReviews.length,
  };
}

export function getAdminStaff() {
  const accounts = readList("vendora-accounts");
  return accounts
    .filter((account) => account.accountType === "Staff")
    .map((account) => ({
      name: account.name,
      email: account.email,
      restricted:
        localStorage.getItem(`vendora-restricted-user-${account.email}`) ===
        "true",
    }));
}

export function saveAdminStaff({ name, email, password, existingEmail }) {
  const normalizedEmail = email.trim().toLowerCase();
  if (name.trim().length < 2)
    return { error: "Enter the staff member's name." };
  if (!/^\S+@\S+\.\S+$/.test(normalizedEmail))
    return { error: "Enter a valid email address." };
  if (!existingEmail && password.length < 6)
    return { error: "Temporary password must be at least 6 characters." };

  const accounts = readList("vendora-accounts");
  if (
    !existingEmail &&
    accounts.some((account) => account.email === normalizedEmail)
  )
    return { error: "An account with this email already exists." };

  const nextAccount = (account = {}) => ({
    ...account,
    name: name.trim(),
    email: existingEmail || normalizedEmail,
    accountType: "Staff",
    password: account.password || password,
    phone: account.phone || "",
  });
  const nextAccounts =
    existingEmail ?
      accounts.map((account) =>
        account.email === existingEmail ? nextAccount(account) : account,
      )
    : [...accounts, nextAccount()];
  localStorage.setItem("vendora-accounts", JSON.stringify(nextAccounts));
  return {
    account: nextAccount(
      accounts.find((account) => account.email === existingEmail),
    ),
  };
}

export function setStaffRestriction(email, restricted) {
  const key = `vendora-restricted-user-${email}`;
  if (restricted) localStorage.setItem(key, "true");
  else localStorage.removeItem(key);
}
