function readList(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    if (Array.isArray(value)) return value;
  } catch {
    // A backend implementation would log invalid moderation data.
  }
  return [];
}

export function getReports() {
  return readList("vendora-reports");
}

// This is the future persistence point for moderation report API requests.
export function saveReports(reports) {
  localStorage.setItem("vendora-reports", JSON.stringify(reports));
}

export function addReport({ product, user, reason, details }) {
  const report = {
    id: Date.now(),
    seller: product.seller,
    sellerEmail: product.sellerEmail,
    product: product.name,
    reason,
    details,
    reporter: user.email,
    status: "Pending",
    createdAt: new Date().toISOString(),
  };
  saveReports([...getReports(), report]);
  return report;
}

export function getSellers() {
  return Object.keys(localStorage)
    .filter((key) => key.startsWith("vendora-products-"))
    .map((key) => {
      const email = key.replace("vendora-products-", "");
      const products = readList(key);
      return {
        email,
        name: products[0]?.seller || email,
        verified: localStorage.getItem(`vendora-verified-${email}`) === "true",
      };
    });
}

export function verifySeller(email) {
  localStorage.setItem(`vendora-verified-${email}`, "true");
}

export function banSeller(email) {
  localStorage.setItem(`vendora-banned-${email}`, "true");
}
