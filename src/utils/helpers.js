// Formats a numeric amount safely for the Philippine peso display used by Vendora.
export function money(value) {
  const amount = Number(value);
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  return `₱${safeAmount.toLocaleString("en-PH")}`;
}

// Returns up to two initials without failing when profile data is incomplete.
export function initials(name) {
  return String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

// Normalizes order IDs before comparing records from buyer and seller data sources.
export function sameOrderId(left, right) {
  const normalizeOrderId = (value) =>
    String(value || "")
      .replace(/^#/i, "")
      .toUpperCase();
  return normalizeOrderId(left) === normalizeOrderId(right);
}
