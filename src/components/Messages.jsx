import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, Bot, ImagePlus, Search, Trash2, X } from "lucide-react";
import AiChat from "../components/AiChat";
import "../styles/Messages.css";
import { initials } from "../utils/helpers";
import {
  fetchConversations,
  searchUsers,
  startConversation,
  fetchMessages,
  sendChatMessage,
  removeConversation,
  imageUrl,
} from "../logic/message";

const AI_ID = "ai";

const ROLE_LABEL = {
  shopper: "Buyer",
  seller: "Seller",
  staff: "Staff",
  admin: "Admin",
};
const POLL_LIST_MS = 5000; // conversation list refresh
const POLL_CHAT_MS = 3000; // open chat refresh
const MAX_IMAGE_MB = 5;
const NOT_FOUND = "Conversation not found.";

function formatTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const time = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  if (date.toDateString() === new Date().toDateString()) return time;
  const day = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  return `${day}, ${time}`;
}

// `target` opens a chat right away (for example from a "Message seller" button).
// It can be a user id (best), { id, name }, or just the seller's name.
function parseTarget(target) {
  if (target && typeof target === "object")
    return {
      id: Number(target.id) || null,
      name: String(target.name || "").trim(),
    };
  const value = String(target ?? "").trim();
  if (/^\d+$/.test(value)) return { id: Number(value), name: "" };
  return { id: null, name: value };
}

export default function Messages({
  target = "",
  role = "",
  onTargetHandled,
  onGoHome,
}) {
  const canUseAi = role === "shopper" || role === "seller";

  const [conversations, setConversations] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [selectedId, setSelectedId] = useState(null);

  const [draft, setDraft] = useState(null);
  const [messages, setMessages] = useState([]);

  const [showChat, setShowChat] = useState(false);
  const [text, setText] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState("");
  const [people, setPeople] = useState([]);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState("");
  const bodyRef = useRef(null);
  const fileRef = useRef(null);
  const handledRef = useRef(onTargetHandled);
  handledRef.current = onTargetHandled;

  const { id: targetId, name: targetName } = parseTarget(target);

  const loadConversations = useCallback(async () => {
    try {
      const list = await fetchConversations();
      setConversations(list);
      return list;
    } catch (err) {
      console.error("Failed to load conversations:", err);
      return null;
    } finally {
      setLoadingList(false);
    }
  }, []);

  // Conversation list: load now, then refresh every few seconds
  useEffect(() => {
    loadConversations();
    const timer = setInterval(() => {
      if (!document.hidden) loadConversations();
    }, POLL_LIST_MS);
    return () => clearInterval(timer);
  }, [loadConversations]);

  // Open a chat with a specific person (e.g. "Message seller")
  useEffect(() => {
    if (!targetId && !targetName) return;
    let cancelled = false;
    (async () => {
      try {
        let personId = targetId;
        if (!personId) {
          // Only a name was given: find the matching person
          const found = await searchUsers(targetName);
          const wanted = targetName.toLowerCase();
          const sameName = found.filter((p) => p.name.toLowerCase() === wanted);
          const match =
            sameName.find((p) => p.role === "seller") || sameName[0];
          if (!match) throw new Error(`Couldn't find "${targetName}".`);
          personId = match.id;
        }
        const conversation = await startConversation(personId);
        if (cancelled) return;
        setDraft(conversation);
        setSelectedId(conversation.id);
        setShowChat(true);
        handledRef.current?.();
      } catch (err) {
        if (!cancelled) setError(err.message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [targetId, targetName]);

  // Open chat: load messages now, then refresh every few seconds.
  // Loading also marks the other person's messages as seen.
  // The AI chat has no server messages, so it is skipped here.
  useEffect(() => {
    if (!selectedId || selectedId === AI_ID) {
      setMessages([]);
      return;
    }
    let cancelled = false;
    setMessages([]);

    const load = async () => {
      try {
        const list = await fetchMessages(selectedId);
        if (!cancelled) setMessages(list);
      } catch (err) {
        if (cancelled) return;
        if (err.message === NOT_FOUND) {
          setSelectedId(null);
          setShowChat(false);
          loadConversations();
        } else {
          setError(err.message);
        }
      }
    };

    load();
    const timer = setInterval(() => {
      if (!document.hidden) load();
    }, POLL_CHAT_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [selectedId, loadConversations]);

  // Search for people (waits a moment after typing stops)
  useEffect(() => {
    const q = search.trim();
    if (q.length < 2) {
      setPeople([]);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(() => {
      searchUsers(q)
        .then((list) => !cancelled && setPeople(list))
        .catch(() => !cancelled && setPeople([]));
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [search]);

  // Preview of the picked photo
  useEffect(() => {
    if (!imageFile) {
      setPreview("");
      return;
    }
    const url = URL.createObjectURL(imageFile);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  // Keep the newest message in view
  useEffect(() => {
    const el = bodyRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length, selectedId, showChat]);

  // The list, plus the chat you just opened if it has no messages yet
  const items =
    draft && !conversations.some((c) => c.id === draft.id) ?
      [
        { ...draft, lastMessage: "", lastMine: false, unread: 0 },
        ...conversations,
      ]
    : conversations;

  const selected = items.find((c) => c.id === selectedId) || null;

  const query = search.trim().toLowerCase();
  const visibleConversations = items.filter((c) =>
    c.name.toLowerCase().includes(query),
  );
  const shownIds = new Set(visibleConversations.map((c) => c.otherId));
  const visiblePeople = people.filter((p) => !shownIds.has(p.id));

  // Show the pinned AI entry when not searching, or when the search matches it
  const showAiEntry =
    canUseAi && (!query || "vendora assistant ai".includes(query));

  const openChat = (id) => {
    if (id !== selectedId) {
      setText("");
      setImageFile(null);
    }
    if (draft && draft.id !== id) setDraft(null);
    setSelectedId(id);
    setShowChat(true);
    setConfirmDelete(false);
    setError("");
  };

  const startWith = async (person) => {
    try {
      const conversation = await startConversation(person.id);
      setDraft(conversation);
      setSearch("");
      setText("");
      setImageFile(null);
      setSelectedId(conversation.id);
      setShowChat(true);
      setConfirmDelete(false);
      setError("");
    } catch (err) {
      setError(err.message);
    }
  };

  const pickImage = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/"))
      return setError("Please choose an image file.");
    if (file.size > MAX_IMAGE_MB * 1024 * 1024)
      return setError(`Image must be smaller than ${MAX_IMAGE_MB}MB.`);
    setError("");
    setImageFile(file);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    const body = text.trim();
    if ((!body && !imageFile) || sending || !selected) return;
    setSending(true);
    setError("");
    try {
      const message = await sendChatMessage(selected.id, {
        body,
        image: imageFile,
      });
      setMessages((current) => [...current, message]);
      setText("");
      setImageFile(null);
      loadConversations();
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  // Removes the chat from your list only. The other person keeps their copy.
  const handleDelete = async () => {
    if (!selected) return;
    try {
      await removeConversation(selected.id);
      setConversations((current) =>
        current.filter((c) => c.id !== selected.id),
      );
      setDraft(null);
      setSelectedId(null);
      setShowChat(false);
      setMessages([]);
    } catch (err) {
      setError(err.message);
    } finally {
      setConfirmDelete(false);
    }
  };

  const nothingFound =
    query &&
    !showAiEntry &&
    visibleConversations.length === 0 &&
    visiblePeople.length === 0;

  return (
    <div>
      <div className="page-title">
        <div>
          <h1>Messages</h1>
          <p>Chat with buyers, sellers and support.</p>
        </div>
      </div>

      {error && (
        <div className="msg-error" role="alert">
          <span>{error}</span>
          <button
            type="button"
            aria-label="Dismiss"
            onClick={() => setError("")}
          >
            <X size={14} />
          </button>
        </div>
      )}

      <div className={"messages-layout" + (showChat ? " chat-open" : "")}>
        <div className="conversation-list">
          <div className="conv-search" role="search">
            <div className="conv-search-field">
              <Search
                size={14}
                className="conv-search-icon"
                aria-hidden="true"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Escape" && setSearch("")}
                placeholder="Search chats or find people"
                aria-label="Search chats or find people"
              />
              {search && (
                <button
                  type="button"
                  className="conv-search-clear"
                  aria-label="Clear search"
                  onClick={() => setSearch("")}
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          {/* AI assistant, always pinned at the top (buyers and sellers only) */}
          {showAiEntry && (
            <button
              className={"ai-entry" + (selectedId === AI_ID ? " selected" : "")}
              onClick={() => openChat(AI_ID)}
            >
              <div className="avatar ai-avatar">
                <Bot size={16} />
              </div>
              <div className="conv-text">
                <b>Vendora Assistant</b>
                <small>Report a concern or ask for help</small>
              </div>
            </button>
          )}

          {visibleConversations.map((c) => {
            const unread = c.unread > 0 && c.id !== selectedId;
            return (
              <button
                className={selectedId === c.id ? "selected" : ""}
                key={c.id}
                onClick={() => openChat(c.id)}
              >
                <div className="avatar">{initials(c.name)}</div>
                <div className="conv-text">
                  <b className={unread ? "unread" : ""}>{c.name}</b>
                  <small>
                    {c.lastMessage ?
                      `${c.lastMine ? "You: " : ""}${c.lastMessage}`
                    : "Start a conversation"}
                  </small>
                </div>
                {unread && (
                  <em className="unread-badge">
                    {c.unread > 99 ? "99+" : c.unread}
                  </em>
                )}
              </button>
            );
          })}

          {visiblePeople.length > 0 && (
            <>
              <p className="conv-section">People</p>
              {visiblePeople.map((person) => (
                <button
                  key={`person-${person.id}`}
                  onClick={() => startWith(person)}
                >
                  <div className="avatar">{initials(person.name)}</div>
                  <div className="conv-text">
                    <b>{person.name}</b>
                    <small>{ROLE_LABEL[person.role] || person.role}</small>
                  </div>
                </button>
              ))}
            </>
          )}

          {!loadingList && items.length === 0 && !query && (
            <p className="conv-empty">
              No conversations yet. Search for someone above to start chatting.
            </p>
          )}
          {nothingFound && (
            <p className="conv-empty">No one found for "{search.trim()}".</p>
          )}
        </div>

        <div className="chat">
          {selectedId === AI_ID && canUseAi ?
            <AiChat
              onHome={onGoHome}
              onBack={() => {
                setShowChat(false);
                setSelectedId(null);
              }}
            />
          : selected ?
            <>
              <div className="chat-head">
                <button
                  type="button"
                  className="chat-back"
                  aria-label="Back to conversations"
                  onClick={() => {
                    setShowChat(false);
                    setSelectedId(null);
                    setDraft(null);
                  }}
                >
                  <ArrowLeft size={18} />
                </button>
                <div className="avatar">{initials(selected.name)}</div>
                <div>
                  <b>{selected.name}</b>
                  <small>{ROLE_LABEL[selected.role] || ""}</small>
                </div>
                <button
                  type="button"
                  className="chat-delete"
                  aria-label="Delete conversation"
                  title="Delete conversation"
                  onClick={() => setConfirmDelete(true)}
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {confirmDelete && (
                <div
                  className="chat-confirm"
                  role="alertdialog"
                  aria-label="Confirm delete conversation"
                >
                  <span>
                    Delete this conversation? It is removed from your list only,{" "}
                    {selected.name} keeps their copy.
                  </span>
                  <div className="chat-confirm-actions">
                    <button
                      type="button"
                      className="confirm-cancel"
                      onClick={() => setConfirmDelete(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="confirm-delete"
                      onClick={handleDelete}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}

              <div className="chat-body" ref={bodyRef}>
                {messages.map((m) => (
                  <div
                    className={`bubble ${m.mine ? "sent" : "received"}`}
                    key={m.id}
                  >
                    {m.image && (
                      <a
                        href={imageUrl(m.image)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <img
                          className="bubble-img"
                          src={imageUrl(m.image)}
                          alt="Shared photo"
                        />
                      </a>
                    )}
                    {m.body && <span className="bubble-text">{m.body}</span>}
                    <span className="bubble-meta">
                      {formatTime(m.createdAt)}
                      {m.mine && (m.seen ? " · Seen" : " · Sent")}
                    </span>
                  </div>
                ))}
              </div>

              {preview && (
                <div className="chat-preview">
                  <img src={preview} alt="Selected" />
                  <button
                    type="button"
                    aria-label="Remove photo"
                    onClick={() => setImageFile(null)}
                  >
                    <X size={14} />
                  </button>
                </div>
              )}

              <form className="chat-input" onSubmit={handleSend}>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  ref={fileRef}
                  onChange={pickImage}
                  hidden
                />
                <button
                  type="button"
                  className="chat-attach"
                  aria-label="Attach a photo"
                  title="Attach a photo"
                  onClick={() => fileRef.current?.click()}
                >
                  <ImagePlus size={18} />
                </button>
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Type a message..."
                  maxLength={2000}
                />
                <button className="primary" type="submit" disabled={sending}>
                  {sending ? "Sending..." : "Send"}
                </button>
              </form>
            </>
          : <div className="chat-empty">
              <b>No conversation selected</b>
              <small>Pick a chat, or search for someone to start one.</small>
            </div>
          }
        </div>
      </div>
    </div>
  );
}
