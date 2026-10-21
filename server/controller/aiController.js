import "../env.js";
import Groq from "groq-sdk";
import { saveReport } from "./reportController.js";

const ALLOWED_ROLES = ["shopper", "seller"];

const SYSTEM_PROMPT = `You are Vendora Assistant, the support helper in the Vendora marketplace app for buyers and sellers.

Language: Always reply in English, even if the user writes in another language.
Style: Friendly and polite. Plain text only, no markdown, asterisks or headings. Keep every reply to 1-3 short sentences. Ask only one question at a time.

You help with two things:
1. Reports about orders, payments, delivery, products, accounts, or other users and stores.
2. Quick questions about using Vendora.

When someone wants to report a concern, collect these details one at a time. Skip anything they already told you:
- Name of the person or store being reported (required)
- Their email (optional)
- Order ID (optional, only if it is about an order)
- What happened and when (required)

As soon as you have the name and what happened, call the submit_report tool. Do not ask for confirmation and do not ask more questions after that. If the user does not know the email or order ID, submit without them. Call the tool only once per report, and never for general questions.

Rules:
- Never say you refunded, banned, cancelled, or changed anything. Only staff can do that.
- Never promise results or deadlines.
- Never ask for passwords, OTP codes, or card numbers.
- Do not ask for photos or screenshots.
- If the question is not about Vendora, politely say you can only help with Vendora support.`;

// The AI calls this when it has collected enough details. The server then
// saves the report to the database, so the AI never touches the database.
const REPORT_TOOL = {
  type: "function",
  function: {
    name: "submit_report",
    description:
      "Save the user's report for staff to review. Call it once the user has said who or what they are reporting and what happened.",
    parameters: {
      type: "object",
      properties: {
        reported_name: {
          type: "string",
          description: "Name of the person or store being reported",
        },
        reported_email: {
          type: "string",
          description: "Email of the person being reported, or empty",
        },
        order_id: { type: "string", description: "Order ID, or empty" },
        subject: {
          type: "string",
          description: "Short title, 100 characters or fewer",
        },
        details: {
          type: "string",
          description: "What happened and when, based on what the user said",
        },
        summary: {
          type: "string",
          description: "Clear summary of the report in 4 lines or fewer",
        },
      },
      required: ["reported_name", "subject", "details", "summary"],
    },
  },
};

// Turns a Groq/network error into a clear message for the user.
// The real error is always printed in the server terminal.
function describeAiError(err) {
  const status = err?.status;
  const detail = String(
    err?.error?.error?.message || err?.message || "",
  ).toLowerCase();

  // Out of free-tier allowance
  if (status === 429) {
    const retryAfter = Number(err?.headers?.["retry-after"]);
    const dailyLimit =
      detail.includes("per day") ||
      detail.includes("tpd") ||
      detail.includes("rpd");

    if (dailyLimit) {
      return {
        status: 429,
        message:
          "The AI assistant has reached its daily usage limit. Please try again later or tomorrow.",
      };
    }
    const wait =
      Number.isFinite(retryAfter) && retryAfter > 0 ?
        ` Please try again in about ${Math.ceil(retryAfter)} seconds.`
      : " Please try again in a minute.";
    return {
      status: 429,
      message: "The AI assistant is busy right now." + wait,
    };
  }

  // Groq servers overloaded or down
  if (status >= 500) {
    return {
      status: 503,
      message:
        "The AI service is temporarily unavailable. Please try again in a few minutes.",
    };
  }

  // Could not reach Groq at all (no internet, DNS, timeout)
  if (
    err?.name === "APIConnectionError" ||
    err?.name === "APIConnectionTimeoutError" ||
    ["ENOTFOUND", "ECONNREFUSED", "ETIMEDOUT", "ECONNRESET"].includes(err?.code)
  ) {
    return {
      status: 503,
      message:
        "The assistant could not connect to the AI service. Please try again shortly.",
    };
  }

  // Setup problems (wrong key, retired model). These are for the developer,
  // so users get a generic message and the terminal shows the real reason.
  if (status === 401 || status === 403) {
    console.error("AI setup problem: the Groq API key is missing or invalid.");
  } else if (status === 404 || detail.includes("decommissioned")) {
    console.error(
      "AI setup problem: the model name is wrong or has been retired. Check GROQ_MODEL.",
    );
  }

  return {
    status: 500,
    message: "The assistant is unavailable right now. Please try again later.",
  };
}

export async function chatWithAssistant(req, res) {
  try {
    const role = req.user?.role;
    if (!ALLOWED_ROLES.includes(role)) {
      return res
        .status(403)
        .json({ message: "AI assistant is not available for your account." });
    }

    if (!process.env.GROQ_API_KEY) {
      console.error("AI setup problem: GROQ_API_KEY is missing in .env.");
      return res
        .status(500)
        .json({ message: "The assistant is not set up yet." });
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const history = Array.isArray(req.body.messages) ? req.body.messages : [];
    const messages = history
      .filter(
        (m) =>
          ["user", "assistant"].includes(m.role) &&
          typeof m.content === "string",
      )
      .slice(-6)
      .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }));

    if (!messages.length)
      return res.status(400).json({ message: "Message is required." });

    const completion = await groq.chat.completions.create({
      model: process.env.GROQ_MODEL || "openai/gpt-oss-120b",
      messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
      temperature: 0.5,
      max_tokens: 600,
      reasoning_effort: "low",
      tools: [REPORT_TOOL],
      tool_choice: "auto",
    });

    const message = completion.choices[0]?.message;
    const call = message?.tool_calls?.find(
      (c) => c.function?.name === "submit_report",
    );

    // The AI collected everything: save the report for staff
    if (call) {
      let args = null;
      try {
        args = JSON.parse(call.function.arguments || "{}");
      } catch {
        args = null;
      }

      if (!args?.reported_name || !args?.subject || !args?.details) {
        return res.json({
          reply:
            "Sorry, I missed some details. Could you tell me who you are reporting and what happened?",
        });
      }

      try {
        const reportId = await saveReport({
          user: req.user,
          source: "ai",
          reportedName: args.reported_name,
          reportedEmail: args.reported_email,
          orderId: args.order_id,
          subject: args.subject,
          details: args.details,
          aiSummary: args.summary,
        });
        const summary = String(args.summary || "").trim();
        return res.json({
          reportId,
          reply:
            (summary ? `Here is your report:\n${summary}\n\n` : "") +
            "Thank you. Your report is now waiting for our staff to review.",
        });
      } catch (saveErr) {
        console.error("Report save error:", saveErr);
        return res.status(500).json({
          message: "Your report could not be saved. Please try again.",
        });
      }
    }

    res.json({
      reply: message?.content || "Sorry, I couldn't answer that.",
    });
  } catch (err) {
    console.error("AI error:", err);
    const { status, message } = describeAiError(err);
    res.status(status).json({ message });
  }
}
