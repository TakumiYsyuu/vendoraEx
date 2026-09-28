import { useState } from "react";
import "../styles/Messages.css";
import { initials } from "../utils/helpers";

export default function Messages({ user, seller = false, target = "" }) {
  const buyerConversations = [
    {
      name: "TechWorld PH",
      messages: [
        ["received", "Hi, is this still available?"],
        ["sent", "Yes, it is! Would you like to place an order?"],
        ["received", "Great! Can you ship it today?"],
        ["sent", "Sure. We'll prepare it for shipment today."],
      ],
    },
    {
      name: "Gadget Hub",
      messages: [
        ["received", "Can you confirm the delivery estimate?"],
        ["sent", "Your order should arrive in 3 to 5 days."],
      ],
    },
    {
      name: "Urban Steps",
      messages: [
        ["received", "Your size is available and ready to ship."],
        ["sent", "Thank you for the update!"],
      ],
    },
    {
      name: "HomeBright",
      messages: [
        ["received", "Do you have this item in another color?"],
        ["sent", "I will check with the shop and get back to you."],
      ],
    },
    {
      name: "Kitchen Choice",
      messages: [
        ["received", "Thanks for your purchase."],
        ["sent", "You are welcome!"],
      ],
    },
  ];
  const sellerConversations = [
    {
      name: "Juan Dela Cruz",
      messages: [
        ["received", "Hi, is this still available?"],
        ["sent", "Yes, it is! Would you like to place an order?"],
        ["received", "Great! Can you ship it today?"],
        ["sent", "Sure. We'll prepare it for shipment today."],
      ],
    },
    {
      name: "Ana Reyes",
      messages: [
        ["received", "Can you confirm the delivery estimate?"],
        ["sent", "Your order should arrive in 3 to 5 days."],
      ],
    },
    {
      name: "Patrick Lim",
      messages: [
        ["received", "The product arrived safely."],
        ["sent", "Thank you for shopping with us!"],
      ],
    },
    {
      name: "Sophia Cruz",
      messages: [
        ["received", "Can I change my delivery address?"],
        ["sent", "Yes, please send the updated address."],
      ],
    },
    {
      name: "Mark Santos",
      messages: [
        ["received", "Do you have more units in stock?"],
        ["sent", "Yes, we have more available."],
      ],
    },
  ];
  let conversations = buyerConversations;
  if (seller) {
    const shopName = user.shopName || `${user.name}'s Shop`;
    const inboxKey = `vendora-inbox-${shopName}`;
    let receivedMessages = [];
    try {
      receivedMessages = JSON.parse(localStorage.getItem(inboxKey) || "[]");
    } catch {
      receivedMessages = [];
    }

    // Group persisted customer messages into the seller's conversation list.
    const receivedConversations = [
      ...new Set(receivedMessages.map((item) => item.from)),
    ].map((name) => ({
      name,
      messages: receivedMessages
        .filter((item) => item.from === name)
        .map((item) => ["received", item.text]),
    }));
    conversations = [...sellerConversations, ...receivedConversations];
  }
  if (
    !seller &&
    target &&
    !conversations.some((conversation) => conversation.name === target)
  )
    conversations.unshift({ name: target, messages: [] });
  const [threads, setThreads] = useState(conversations);
  const [selectedName, setSelectedName] = useState(
    target || conversations[0].name,
  );
  const [message, setMessage] = useState("");
  const selectedConversation =
    threads.find((conversation) => conversation.name === selectedName) ||
    threads[0];

  const getLastMessage = (conversation) => {
    const lastMessage = conversation.messages.at(-1);
    if (!lastMessage) return "Start a conversation";
    return lastMessage[1];
  };
  const getMessagesTitle = () => {
    if (seller) return "Customer Messages";
    return "Seller Messages";
  };
  const getMessagesDescription = () => {
    if (seller) return "Chat with your customers.";
    return "Chat with the stores you buy from.";
  };
  const getMessagePlaceholder = () => {
    if (seller) return "Reply to your customer...";
    return "Message this seller...";
  };
  const sendMessage = (e) => {
    e.preventDefault();
    const text = message.trim();
    if (!text) return;
    if (!seller) {
      // This local persistence call is the future handoff point for a messaging API.
      const inboxKey = `vendora-inbox-${selectedName}`;
      const inbox = JSON.parse(localStorage.getItem(inboxKey) || "[]");
      localStorage.setItem(
        inboxKey,
        JSON.stringify([
          ...inbox,
          { from: user.name, text, time: new Date().toISOString() },
        ]),
      );
    }
    setThreads((current) =>
      current.map((conversation) => {
        if (conversation.name !== selectedName) return conversation;
        return {
          ...conversation,
          messages: [...conversation.messages, ["sent", text]],
        };
      }),
    );
    setMessage("");
  };
  return (
    <div>
      <div className="page-title">
        <div>
          <h1>{getMessagesTitle()}</h1>
          <p>{getMessagesDescription()}</p>
        </div>
      </div>
      <div className="messages-layout">
        <div className="conversation-list">
          {threads.map((conversation) => (
            <button
              className={selectedName === conversation.name ? "selected" : ""}
              key={conversation.name}
              onClick={() => setSelectedName(conversation.name)}
            >
              <div className="avatar">{initials(conversation.name)}</div>
              <div>
                <b>{conversation.name}</b>
                <small>{getLastMessage(conversation)}</small>
              </div>
            </button>
          ))}
        </div>
        <div className="chat">
          <div className="chat-head">
            <div className="avatar">{initials(selectedConversation.name)}</div>
            <div>
              <b>{selectedConversation.name}</b>
              <small>Online</small>
            </div>
          </div>
          <div className="chat-body">
            {selectedConversation.messages.map(([type, messageText], index) => (
              <div
                className={`bubble ${type}`}
                key={`${selectedConversation.name}-${index}`}
              >
                {messageText}
              </div>
            ))}
          </div>
          <form className="chat-input" onSubmit={sendMessage}>
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={getMessagePlaceholder()}
            />
            <button className="primary" type="submit">
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
