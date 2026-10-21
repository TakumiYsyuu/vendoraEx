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
  if (!res.ok) throw new Error(data?.message || "Something went wrong.");
  return data;
}

const STATUS = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Declined",
};

const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString("en-PH", { dateStyle: "medium" }) : "";

async function toBlobUrl(dataUrl) {
  if (!dataUrl) return "";
  const blob = await (await fetch(dataUrl)).blob();
  return URL.createObjectURL(blob);
}

const toApplication = (v) => ({
  id: v.id,
  shopName: v.shop_name || `${v.fullname}'s Shop`,
  ownerName: v.fullname,
  email: v.email,
  phone: v.phone_num,
  address: "",
  description: v.shop_description || "",
  submittedAt: formatDate(v.submitted_at),
  status: STATUS[v.status] || "Pending",
  declineReason: v.rejection_reason || "",
  documents: [
    { label: `Valid ID (${v.id_type})`, url: "" },
    ...(v.parent_id_type ?
      [{ label: `Guardian ID (${v.parent_id_type})`, url: "" }]
    : []),
  ],
});

export const fetchApplications = async () =>
  (await request("/admin/verifications")).verifications.map(toApplication);

export async function loadApplicationDocuments(application) {
  const data = await request(`/admin/verifications/${application.id}/images`);
  const urls = [data.id_image, data.parent_id_image];
  return Promise.all(
    application.documents.map(async (doc, i) => ({
      ...doc,
      url: await toBlobUrl(urls[i]),
    })),
  );
}

export const approveApplication = (application) =>
  request(`/admin/verifications/${application.id}/approve`, { method: "PUT" });

export const declineApplication = (application, reason) =>
  request(`/admin/verifications/${application.id}/reject`, {
    method: "PUT",
    body: JSON.stringify({ reason }),
  });
