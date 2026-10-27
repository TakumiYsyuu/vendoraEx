import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Bot,
  CheckCircle2,
  FileText,
  MessageSquare,
} from "lucide-react";
import { sendAiMessage, submitReport } from "../logic/message";

const EMPTY_FORM = {
  reportedName: "",
  reportedContact: "",
  orderId: "",
  subject: "",
  details: "",
};

function validateForm(f) {
  const errors = {};
  const name = f.reportedName.trim();
  const email = f.reportedContact.trim();
  const orderId = f.orderId.trim();
  const subject = f.subject.trim();
  const details = f.details.trim();

  if (!name) errors.reportedName = "Enter the name of the person or store.";
  else if (name.length < 2) errors.reportedName = "Name is too short.";

  if (email && !/^\S+@\S+\.\S+$/.test(email))
    errors.reportedContact = "Enter a valid email address.";

  if (orderId && !/^[A-Za-z0-9_-]+$/.test(orderId))
    errors.orderId = "Use only letters, numbers, dashes and underscores.";

  if (!subject) errors.subject = "Enter a subject.";
  else if (subject.length < 5)
    errors.subject = "Subject must be at least 5 characters.";

  if (!details) errors.details = "Tell us what happened.";
  else if (details.length < 20)
    errors.details = `Please add more detail (${details.length}/20 characters minimum).`;

  return errors;
}

export default function AiChat({ onBack, onHome }) {
  const [mode, setMode] = useState("menu");
  const [sentReport, setSentReport] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const bodyRef = useRef(null);

  useEffect(() => {
    const el = bodyRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length, busy, mode, error]);

  const setField = (key) => (e) => {
    setForm((current) => ({ ...current, [key]: e.target.value }));
    setFieldErrors((current) => ({ ...current, [key]: undefined }));
  };

  const send = async (content) => {
    const next = [...messages, { role: "user", content }];
    setMessages(next);
    setBusy(true);
    setError("");
    try {
      const reply = await sendAiMessage(next);
      setMessages([...next, { role: "assistant", content: reply }]);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const submitText = (e) => {
    e.preventDefault();
    const body = text.trim();
    if (!body || busy) return;
    setText("");
    send(body);
  };

  const submitForm = async (e) => {
    e.preventDefault();
    if (submitting) return;

    const errors = validateForm(form);
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;

    const data = {
      reportedName: form.reportedName.trim(),
      reportedEmail: form.reportedContact.trim(),
      orderId: form.orderId.trim(),
      subject: form.subject.trim(),
      details: form.details.trim(),
    };

    setSubmitting(true);
    setFormError("");
    try {
      await submitReport(data);
      setSentReport({ subject: data.subject, orderId: data.orderId });
      setForm(EMPTY_FORM);
      setFieldErrors({});
      setMode("sent");
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const FieldError = ({ name }) =>
    fieldErrors[name] ?
      <small className="ai-field-error" role="alert">
        {fieldErrors[name]}
      </small>
    : null;

  return (
    <>
      <div className="chat-head">
        <button
          type="button"
          className="chat-back"
          aria-label="Back to conversations"
          onClick={onBack}
        >
          <ArrowLeft size={18} />
        </button>
        <div className="avatar ai-avatar">
          <Bot size={20} />
        </div>
        <div>
          <b>Vendora Assistant</b>
          <small>AI support · Reports and help</small>
        </div>
      </div>

      <div className="chat-body" ref={bodyRef}>
        {mode === "menu" && (
          <div className="ai-menu">
            <div className="ai-menu-intro">
              <h2>How can we help?</h2>
              <p>
                Report a problem with a person, store or order, or ask a
                question about using Vendora.
              </p>
            </div>
            <button
              type="button"
              className="ai-option"
              onClick={() => setMode("form")}
            >
              <span className="ai-option-icon">
                <FileText size={22} />
              </span>
              <span>
                <b>Report a concern</b>
                <small>
                  Fill out a short form with the details of what happened.
                </small>
              </span>
            </button>
            <button
              type="button"
              className="ai-option"
              onClick={() => setMode("chat")}
            >
              <span className="ai-option-icon">
                <MessageSquare size={22} />
              </span>
              <span>
                <b>Type your concern or question</b>
                <small>Chat with the assistant in your own words.</small>
              </span>
            </button>
          </div>
        )}

        {mode === "form" && (
          <form className="ai-form" onSubmit={submitForm} noValidate>
            <div className="ai-form-head">
              <h2>Report a concern</h2>
              <p>
                Give us as much detail as you can so the issue can be reviewed
                quickly. Fields marked with * are required.
              </p>
            </div>

            <div className="ai-section">
              <h3>Who are you reporting?</h3>
              <div className="ai-grid">
                <label className="ai-field">
                  <span>
                    Name of person or store<b className="req">*</b>
                  </span>
                  <input
                    value={form.reportedName}
                    onChange={setField("reportedName")}
                    placeholder="e.g. Juan Dela Cruz or Gadget Shop"
                    maxLength={100}
                    aria-invalid={!!fieldErrors.reportedName}
                  />
                  <FieldError name="reportedName" />
                </label>
                <label className="ai-field">
                  <span>
                    Email address <em>Optional</em>
                  </span>
                  <input
                    type="email"
                    value={form.reportedContact}
                    onChange={setField("reportedContact")}
                    placeholder="name@example.com"
                    maxLength={120}
                    aria-invalid={!!fieldErrors.reportedContact}
                  />
                  <FieldError name="reportedContact" />
                </label>
              </div>
            </div>

            <div className="ai-section">
              <h3>Report details</h3>
              <div className="ai-grid">
                <label className="ai-field">
                  <span>
                    Order ID <em>Optional</em>
                  </span>
                  <input
                    value={form.orderId}
                    onChange={setField("orderId")}
                    placeholder="e.g. ORD-1024"
                    maxLength={40}
                    aria-invalid={!!fieldErrors.orderId}
                  />
                  <FieldError name="orderId" />
                </label>
                <label className="ai-field">
                  <span>
                    Subject<b className="req">*</b>
                  </span>
                  <input
                    value={form.subject}
                    onChange={setField("subject")}
                    placeholder="Short summary of the problem"
                    maxLength={100}
                    aria-invalid={!!fieldErrors.subject}
                  />
                  <FieldError name="subject" />
                </label>
                <label className="ai-field full">
                  <span>
                    What happened?<b className="req">*</b>
                  </span>
                  <textarea
                    value={form.details}
                    onChange={setField("details")}
                    placeholder="Describe what happened, when it happened, and anything you already tried."
                    maxLength={1500}
                    aria-invalid={!!fieldErrors.details}
                  />
                  <FieldError name="details" />
                  <small className="ai-hint">
                    {form.details.length} / 1500
                  </small>
                </label>
              </div>
            </div>

            {formError && (
              <p className="ai-error" role="alert">
                {formError}
              </p>
            )}

            <div className="ai-form-actions">
              <button
                type="button"
                className="ai-btn-secondary"
                onClick={() => setMode("menu")}
              >
                Back
              </button>
              <button type="submit" className="primary" disabled={submitting}>
                {submitting ? "Submitting..." : "Submit report"}
              </button>
            </div>
          </form>
        )}

        {mode === "sent" && (
          <div className="ai-success" role="status">
            <span className="ai-success-icon">
              <CheckCircle2 size={34} />
            </span>
            <h2>Report submitted</h2>
            <p>
              Thank you. Your report is now waiting for our staff to check and
              review.
            </p>
            {sentReport && (
              <dl className="ai-success-summary">
                <div>
                  <dt>Subject</dt>
                  <dd>{sentReport.subject}</dd>
                </div>
                {sentReport.orderId && (
                  <div>
                    <dt>Order ID</dt>
                    <dd>{sentReport.orderId}</dd>
                  </div>
                )}
              </dl>
            )}
            <div className="ai-form-actions">
              <button
                type="button"
                className="ai-btn-secondary"
                onClick={() => setMode("form")}
              >
                Submit another report
              </button>
              <button
                type="button"
                className="primary"
                onClick={() => (onHome ? onHome() : onBack())}
              >
                Back to home
              </button>
            </div>
          </div>
        )}

        {mode === "chat" && (
          <>
            {messages.length === 0 && (
              <div className="bubble received">
                <span className="bubble-text">
                  Hi! Type your concern or question and I'll help you with it.
                </span>
              </div>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={`bubble ${m.role === "user" ? "sent" : "received"}`}
              >
                <span
                  className="bubble-text"
                  style={{ whiteSpace: "pre-wrap" }}
                >
                  {m.content}
                </span>
              </div>
            ))}
            {busy && (
              <div
                className="bubble received"
                role="status"
                aria-label="Assistant is typing"
              >
                <span className="ai-typing">
                  <i />
                  <i />
                  <i />
                </span>
              </div>
            )}
            {error && (
              <p className="ai-error" role="alert">
                {error}
              </p>
            )}
          </>
        )}
      </div>

      {mode === "chat" && (
        <form className="chat-input" onSubmit={submitText}>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type your concern or question..."
            maxLength={1000}
          />
          <button className="primary" type="submit" disabled={busy}>
            {busy ? "Sending..." : "Send"}
          </button>
        </form>
      )}
    </>
  );
}
