export const MIN_AGE = 14;
export const MINOR_AGE = 18;
export const MAX_AGE = 80;

export const ID_TYPES = [
  "Philippine National ID (PhilSys)",
  "Driver's License",
  "Passport",
  "UMID",
  "SSS ID",
  "PRC ID",
  "Postal ID",
  "Voter's ID",
  "School ID",
  "Student Permit",
];

export const GUARDIAN_ID_TYPES = [
  "Philippine National ID (PhilSys)",
  "Driver's License",
  "Passport",
  "UMID",
  "SSS ID",
  "PRC ID",
  "Postal ID",
  "Voter's ID",
];

export const todayISO = () => {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export const calcAge = (iso) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso || "")) return null;
  const [y, m, d] = iso.split("-").map(Number);
  const born = new Date(y, m - 1, d);
  if (
    born.getFullYear() !== y ||
    born.getMonth() !== m - 1 ||
    born.getDate() !== d
  )
    return null;
  const now = new Date();
  let age = now.getFullYear() - y;
  if (now.getMonth() < m - 1 || (now.getMonth() === m - 1 && now.getDate() < d))
    age--;
  return age;
};

const API = (import.meta.env.VITE_URL || "http://localhost:5000/api").replace(
  /\/$/,
  "",
);

async function request(path, options = {}) {
  let res;
  try {
    res = await fetch(`${API}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("vendora_token")}`,
      },
    });
  } catch {
    throw new Error("Could not reach the server. Please try again.");
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(
      (data?.errors && Object.values(data.errors)[0]) ||
        data?.message ||
        "Something went wrong.",
    );
  }
  return data;
}

export const getVerification = () => request("/shop/verification");

export const submitVerification = (form) =>
  request("/shop/verification", {
    method: "POST",
    body: JSON.stringify(form),
  });

export const getShopProfile = async () => (await request("/shop")).shop;

export const updateShopProfile = ({ name, description }) =>
  request("/shop", {
    method: "PUT",
    body: JSON.stringify({ name, description }),
  });
