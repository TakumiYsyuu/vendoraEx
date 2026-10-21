const API_URL = import.meta.env.VITE_URL || "http://localhost:5000/api";
const SERVER_URL = API_URL.replace(/\/api\/?$/, "");
const MESSAGES_API = `${API_URL}/messages`;

const authHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem("vendora_token")}`,
});

async function messageRequest(url, options = {}) {
  let res;
  try {
    res = await fetch(url, {
      ...options,
      headers: { ...authHeader(), ...options.headers },
    });
  } catch {
    throw new Error("Could not reach the server.");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Something went wrong.");
  return data;
}

export const imageUrl = (path) => (path ? SERVER_URL + path : "");

export const fetchConversations = async () =>
  (await messageRequest(`${MESSAGES_API}/conversations`)).conversations;

export const searchUsers = async (q) =>
  (await messageRequest(`${MESSAGES_API}/users?q=${encodeURIComponent(q)}`))
    .users;

export const startConversation = async (userId) =>
  (
    await messageRequest(`${MESSAGES_API}/conversations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    })
  ).conversation;

export const fetchMessages = async (conversationId) =>
  (
    await messageRequest(
      `${MESSAGES_API}/conversations/${conversationId}/messages`,
    )
  ).messages;

export const sendChatMessage = async (conversationId, { body, image }) => {
  const form = new FormData();
  if (body) form.append("body", body);
  if (image) form.append("image", image);
  const data = await messageRequest(
    `${MESSAGES_API}/conversations/${conversationId}/messages`,
    { method: "POST", body: form },
  );
  return data.message;
};

export const removeConversation = (conversationId) =>
  messageRequest(`${MESSAGES_API}/conversations/${conversationId}`, {
    method: "DELETE",
  });

export const sendAiMessage = async (messages) =>
  (
    await messageRequest(`${API_URL}/ai/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
    })
  ).reply;

export const submitReport = async (report) =>
  (
    await messageRequest(`${API_URL}/reports`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(report),
    })
  ).report;
