import { useState, useEffect } from "react";
import { ShieldAlert, ShieldCheck, Clock, XCircle } from "lucide-react";
import ImageUpload from "./ImageUpload";
import {
  ID_TYPES,
  GUARDIAN_ID_TYPES,
  MIN_AGE,
  MINOR_AGE,
  MAX_AGE,
  calcAge,
  todayISO,
  getVerification,
  submitVerification,
} from "../logic/verification";

const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString("en-PH", { dateStyle: "medium" }) : "";

const STATUS = {
  unverified: {
    Icon: ShieldAlert,
    tone: "warn",
    pill: "Not verified",
    title: "Verification required",
    text: () =>
      "Fill in the details below and upload your ID. Our admin team reviews every store before it can start selling.",
  },
  pending: {
    Icon: Clock,
    tone: "info",
    pill: "Pending review",
    title: "Under review",
    text: (r) =>
      `Submitted on ${formatDate(r.submitted_at)}. You'll be able to sell once an admin approves your documents.`,
  },
  approved: {
    Icon: ShieldCheck,
    tone: "ok",
    pill: "Verified",
    title: "Your store is verified",
    text: (r) =>
      `Approved${r.reviewed_at ? ` on ${formatDate(r.reviewed_at)}` : ""}. You're all set to sell on Vendora.`,
  },
  rejected: {
    Icon: XCircle,
    tone: "bad",
    pill: "Rejected",
    title: "Verification was rejected",
    text: (r) =>
      `Reason: ${r.rejection_reason || "No reason was given."} Please correct the details below and resubmit.`,
  },
};

const EMPTY = {
  birth_date: "",
  id_type: "",
  id_image: "",
  parent_id_type: "",
  parent_id_image: "",
};

const fromRecord = (r) =>
  r ?
    {
      birth_date: r.birth_date,
      id_type: r.id_type,
      id_image: r.id_image,
      parent_id_type: r.parent_id_type ?? "",
      parent_id_image: r.parent_id_image ?? "",
    }
  : EMPTY;

function validate(form, age, isMinor) {
  const errors = {};

  if (!form.birth_date) errors.birth_date = "Enter your birth date.";
  else if (age === null || age < 0)
    errors.birth_date = "Birth date can't be in the future.";
  else if (age < MIN_AGE)
    errors.birth_date = `You must be at least ${MIN_AGE} years old to open a store.`;
  else if (age > MAX_AGE)
    errors.birth_date = `Sellers must be ${MAX_AGE} years old or younger.`;

  if (!form.id_type) errors.id_type = "Choose your ID type.";
  if (!form.id_image) errors.id_image = "Upload a clear photo of your ID.";

  if (isMinor) {
    if (!form.parent_id_type)
      errors.parent_id_type = "Choose your guardian's ID type.";
    if (!form.parent_id_image)
      errors.parent_id_image = "Upload a clear photo of your guardian's ID.";
  }
  return errors;
}

function IdTypeSelect({ label, name, value, options, error, onChange }) {
  return (
    <label className="wide">
      {label}
      <select
        name={name}
        value={value}
        onChange={onChange}
        aria-invalid={!!error}
      >
        <option value="">Select ID type</option>
        {options.map((type) => (
          <option key={type}>{type}</option>
        ))}
      </select>
      {error && <small className="field-error">{error}</small>}
    </label>
  );
}

export default function Verification() {
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    getVerification()
      .then((r) => {
        if (!active) return;
        setRecord(r);
        setForm(fromRecord(r));
      })
      .catch(() => {
        if (active) setSubmitError("Couldn't load your verification status.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const state = record?.status ?? "unverified";
  const { Icon, tone, pill, title, text } = STATUS[state];
  const canEdit = state === "unverified" || state === "rejected";
  const age = calcAge(form.birth_date);
  const isMinor = age !== null && age >= MIN_AGE && age < MINOR_AGE;

  const set = (name, value) => {
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((e) => ({ ...e, [name]: undefined }));
  };
  const onField = (e) => set(e.target.name, e.target.value);

  const submit = async (e) => {
    e.preventDefault();
    const found = validate(form, age, isMinor);
    setErrors(found);
    if (Object.keys(found).length) return;

    setSubmitting(true);
    try {
      const saved = await submitVerification(form);
      setRecord(saved);
      setForm(fromRecord(saved));
      setSubmitError("");
    } catch (err) {
      setSubmitError(err.message || "We couldn't save your documents.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="form-card">
        <div className="section-head">
          <h2>Seller Verification</h2>
        </div>
        <p>Loading…</p>
      </div>
    );
  }

  return (
    <form className="form-card" onSubmit={submit} noValidate>
      <div className="section-head">
        <div>
          <h2>Seller Verification</h2>
          <p>Verify your identity so an admin can approve your store.</p>
        </div>
        <span className={`verify-pill tone-${tone}`}>{pill}</span>
      </div>

      <div className={`verify-banner tone-${tone}`} role="status">
        <Icon size={18} />
        <div>
          <strong>{title}</strong>
          <p>{text(record)}</p>
        </div>
      </div>

      <fieldset className="verify-fields" disabled={!canEdit}>
        <div className="fields">
          <label>
            Birth Date
            <input
              type="date"
              name="birth_date"
              value={form.birth_date}
              max={todayISO()}
              onChange={onField}
              onClick={(e) => {
                try {
                  e.currentTarget.showPicker?.();
                } catch {
                  /* picker not available, typing still works */
                }
              }}
              aria-invalid={!!errors.birth_date}
            />
            {errors.birth_date && (
              <small className="field-error">{errors.birth_date}</small>
            )}
          </label>
          <label>
            Age
            <input
              value={age !== null && age >= 0 ? `${age} years old` : ""}
              placeholder="Filled in from your birth date"
              readOnly
              tabIndex={-1}
            />
          </label>

          <IdTypeSelect
            label="ID Type"
            name="id_type"
            value={form.id_type}
            options={ID_TYPES}
            error={errors.id_type}
            onChange={onField}
          />
          <ImageUpload
            label="Photo of your ID"
            value={form.id_image}
            error={errors.id_image}
            disabled={!canEdit}
            onChange={(v) => set("id_image", v)}
          />

          {isMinor && (
            <>
              <p className="guardian-note">
                You're under {MINOR_AGE}, so a parent or guardian's ID is also
                required to open a store.
              </p>
              <IdTypeSelect
                label="Parent / Guardian ID Type"
                name="parent_id_type"
                value={form.parent_id_type}
                options={GUARDIAN_ID_TYPES}
                error={errors.parent_id_type}
                onChange={onField}
              />
              <ImageUpload
                label="Photo of parent / guardian's ID"
                value={form.parent_id_image}
                error={errors.parent_id_image}
                disabled={!canEdit}
                onChange={(v) => set("parent_id_image", v)}
              />
            </>
          )}
        </div>
      </fieldset>

      {canEdit && (
        <div className="settings-actions">
          <button className="primary" type="submit" disabled={submitting}>
            {submitting ?
              "Submitting…"
            : record ?
              "Resubmit for Review"
            : "Submit for Verification"}
          </button>
          {submitError && <small className="field-error">{submitError}</small>}
        </div>
      )}
    </form>
  );
}
