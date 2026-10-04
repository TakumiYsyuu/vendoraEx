import { useId, useState } from "react";
import { registerAccount } from "../logic/auth";
import "../styles/RegisterPage.css";

const ACCOUNT_TYPES = [
  { value: "shopper", label: "Shopper", hint: "Browse and buy" },
  { value: "seller", label: "Seller", hint: "List and sell products" },
];

const TOTAL_FIELDS = 6;
const PASSWORD_MAX = 16;
const PRIVACY_MODAL_ID = "privacy_modal";

// Each validator returns "" when the value is OK, or an error message.
const validate = {
  accountType: (value) =>
    value ? "" : "Please choose whether you're a Shopper or a Seller.",

  name: (value) => {
    const text = value.trim();
    if (!text) return "Please enter your full name.";
    if (text.length < 2) return "Your name is too short.";
    if (!/^[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ .'-]*$/.test(text))
      return "Name can only have letters, spaces, . ' and -";
    return "";
  },

  email: (value) => {
    const text = value.trim();
    if (!text) return "Please enter your email address.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(text))
      return "Enter a valid email like you@example.com";
    return "";
  },

  phone: (value) => {
    if (!value) return "Please enter your phone number.";
    if (!/^09\d{9}$/.test(value))
      return "Enter an 11-digit mobile number starting with 09.";
    return "";
  },

  password: (value) => {
    if (!value) return "Please create a password.";
    if (value.length < 6) return "Password must be at least 6 characters.";
    if (value.length > PASSWORD_MAX)
      return `Password can be up to ${PASSWORD_MAX} characters.`;
    return "";
  },

  privacy: (checked) =>
    checked ? "" : "You must agree to the Privacy Policy to continue.",
};

function getPasswordStrength(password) {
  if (!password)
    return { label: "Add a password to continue", level: "unfilled" };

  let score = 0;
  if (password.length >= 6) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/\d/.test(password) || /[^A-Za-z0-9]/.test(password)) score += 1;

  if (score === 3) return { label: "Strong password", level: "strong" };
  if (score === 2) return { label: "Good password", level: "medium" };
  return { label: "Use at least 6 characters", level: "weak" };
}

export default function RegisterPage({ onRegister, onGoToLogin }) {
  const [accountType, setAccountType] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const errors = {
    accountType: validate.accountType(accountType),
    name: validate.name(name),
    email: validate.email(email),
    phone: validate.phone(phone),
    password: validate.password(password),
    privacy: validate.privacy(agreedToPrivacy),
  };

  // A field counts as complete only when it is filled in correctly
  const completedFields = Object.values(errors).filter((e) => !e).length;
  const fieldsRemaining = TOTAL_FIELDS - completedFields;
  const passwordStrength = getPasswordStrength(password);

  // Show a field's error after it was left once, or after pressing submit
  const showError = (key) => (touched[key] || submitted ? errors[key] : "");
  const touch = (key) => setTouched((current) => ({ ...current, [key]: true }));

  const updateField = (setter) => (value) => {
    setter(value);
    setError("");
  };

  const submit = async (event) => {
    event.preventDefault();
    setSubmitted(true);

    if (fieldsRemaining > 0) {
      const form = event.currentTarget;
      setTimeout(() => form.querySelector('[aria-invalid="true"]')?.focus(), 0);
      return;
    }

    const result = await registerAccount({
      name: name.trim(),
      email: email.trim(),
      phone,
      password,
      accountType,
    });
    if (result.error) return setError(result.error);
    onGoToLogin();
  };

  return (
    <AuthLayout
      variant="register"
      title="Create your account"
      description="Join Vendora to shop, sell, and manage your account."
    >
      <div
        className="register-progress"
        aria-label={`${completedFields} of ${TOTAL_FIELDS} details completed`}
      >
        <span>Account details</span>
        <strong>
          {fieldsRemaining ? `${fieldsRemaining} left` : "Ready to create"}
        </strong>
        <div className="register-progress-track" aria-hidden="true">
          <span
            style={{ transform: `scaleX(${completedFields / TOTAL_FIELDS})` }}
          />
        </div>
      </div>
      <form className="register-form" onSubmit={submit} noValidate>
        <AccountTypePicker
          value={accountType}
          onChange={updateField(setAccountType)}
          error={showError("accountType")}
        />
        <Field
          label="Full Name"
          value={name}
          onChange={updateField(setName)}
          onBlur={() => touch("name")}
          error={showError("name")}
          placeholder="Your full name"
          autoComplete="name"
        />
        <Field
          label="Email Address"
          type="email"
          value={email}
          onChange={updateField(setEmail)}
          onBlur={() => touch("email")}
          error={showError("email")}
          placeholder="you@example.com"
          autoComplete="email"
        />
        <Field
          label="Phone Number"
          type="tel"
          inputMode="numeric"
          maxLength={11}
          value={phone}
          onChange={(value) => updateField(setPhone)(value.replace(/\D/g, ""))}
          onBlur={() => touch("phone")}
          error={showError("phone")}
          placeholder="09123456789"
          autoComplete="tel"
        />
        <Field
          label="Password"
          type="password"
          maxLength={PASSWORD_MAX}
          value={password}
          onChange={updateField(setPassword)}
          onBlur={() => touch("password")}
          error={showError("password")}
          placeholder="Create a password"
          autoComplete="new-password"
        />
        <div className={`password-feedback ${passwordStrength.level}`}>
          <span className="strength-bars" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <span>{passwordStrength.label}</span>
        </div>
        <PrivacyConsent
          checked={agreedToPrivacy}
          onChange={updateField(setAgreedToPrivacy)}
          error={showError("privacy")}
        />
        {error && (
          <p className="register-error" role="alert">
            {error}
          </p>
        )}
        <button className="register-submit" type="submit">
          {fieldsRemaining ?
            `Complete ${fieldsRemaining} more ${fieldsRemaining === 1 ? "field" : "fields"}`
          : "Create Account"}
        </button>
      </form>
      <SwitchLink onClick={onGoToLogin}>
        Already have an account? Sign in
      </SwitchLink>

      <PrivacyModal
        onAgree={() => {
          setAgreedToPrivacy(true);
          setError("");
        }}
      />
    </AuthLayout>
  );
}

export function AuthLayout({
  variant,
  title,
  description,
  contentKey,
  children,
}) {
  return (
    <main className={`auth-page ${variant}-page`}>
      <section className={`register-card ${variant}-card`}>
        <div className="register-brand">
          <span className="register-brand-mark">V</span>
          <span>Vendora</span>
        </div>
        <h1
          key={`title-${contentKey || variant}`}
          className={contentKey ? "auth-dynamic-heading" : ""}
        >
          {title}
        </h1>
        <p
          key={`description-${contentKey || variant}`}
          className="register-description"
        >
          {description}
        </p>
        {children}
      </section>
    </main>
  );
}

export function AccountTypePicker({ value, onChange, error }) {
  return (
    <fieldset
      className={`account-type ${error ? "invalid" : ""}`}
      aria-required="true"
    >
      <legend>I want to join as (required)</legend>
      <div className="account-type-options" role="radiogroup">
        {ACCOUNT_TYPES.map((type) => (
          <label
            key={type.value}
            className={`account-type-option ${value === type.value ? "selected" : ""}`}
          >
            <input
              type="radio"
              name="accountType"
              value={type.value}
              checked={value === type.value}
              onChange={() => onChange(type.value)}
              aria-invalid={error ? "true" : undefined}
            />
            <strong>{type.label}</strong>
            <span>{type.hint}</span>
          </label>
        ))}
      </div>
      {error && <p className="field-error">{error}</p>}
    </fieldset>
  );
}

export function Field({
  label,
  type = "text",
  value,
  onChange,
  onBlur,
  error,
  placeholder,
  autoComplete,
  inputMode,
  maxLength,
}) {
  const errorId = useId();

  return (
    <label className="register-field">
      {label}
      <input
        className={`register-input ${error ? "invalid" : ""}`}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        autoComplete={autoComplete}
        inputMode={inputMode}
        maxLength={maxLength}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error ? errorId : undefined}
      />
      {error && (
        <span id={errorId} className="field-error">
          {error}
        </span>
      )}
    </label>
  );
}

export function PrivacyConsent({ checked, onChange, error }) {
  return (
    <>
      <label className="register-remember">
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          aria-required="true"
          aria-invalid={error ? "true" : undefined}
        />
        <span>
          I agree to the{" "}
          <button
            type="button"
            className="privacy-link"
            onClick={() => {
              const modal = document.getElementById(PRIVACY_MODAL_ID);
              modal.showModal();
              modal.querySelector(".privacy-text").scrollTop = 0;
            }}
          >
            Privacy Policy
          </button>
        </span>
      </label>
      {error && <p className="field-error consent-error">{error}</p>}
    </>
  );
}

export function PrivacyModal({ onAgree }) {
  return (
    <dialog id={PRIVACY_MODAL_ID} className="privacy-modal">
      <h2>Vendora Privacy &amp; Marketplace Policy</h2>

      <div className="privacy-text">
        <p>
          By using Vendora, you agree to follow this policy and our marketplace
          rules.
        </p>

        <h3>1. Information We Collect</h3>
        <p>
          Vendora may collect information such as your name, email, contact
          details, account information, transaction history, messages, IP
          address, device information, and other information necessary to
          operate and secure the platform.
        </p>

        <h3>2. How We Use Your Information</h3>
        <p>
          We use your information to provide Vendora's services, process orders
          and payments, communicate with users, prevent fraud, resolve disputes,
          improve our platform, and comply with applicable laws.
        </p>

        <h3>3. User Conduct</h3>
        <p>
          Buyers and sellers must treat each other respectfully. Scamming,
          fraud, harassment, threats, impersonation, fake reviews, stolen
          accounts, misleading listings, and other abusive or unlawful behavior
          are prohibited.
        </p>

        <h3>4. Fraud &amp; Scams</h3>
        <p>
          Users must not intentionally scam, deceive, or financially harm other
          users. Vendora may investigate suspicious activity, restrict accounts,
          cancel transactions where appropriate, preserve relevant information,
          and cooperate with law enforcement when legally required or
          appropriate.
        </p>

        <h3>5. Account Suspension</h3>
        <p>
          Vendora may warn, restrict, suspend, or permanently terminate accounts
          that violate our policies. Serious violations may result in the
          removal of listings, transaction restrictions, or other appropriate
          action.
        </p>

        <h3>6. Legal Action</h3>
        <p>
          If a user's actions may involve fraud, theft, threats, abuse, or other
          unlawful conduct, Vendora may preserve relevant records and pursue
          available legal remedies or report the matter to appropriate
          authorities. Breaking a Vendora rule does not automatically mean a
          criminal case will be filed.
        </p>

        <h3>7. Account Deletion &amp; Data Retention</h3>
        <p>
          Users may request to deactivate or delete their account. Some
          information may be retained for up to 3 years, where reasonably
          necessary for fraud prevention, transaction records, disputes,
          security, legal claims, or legal/regulatory requirements. Information
          will be deleted, anonymized, or securely disposed of when it is no
          longer necessary and where required by applicable law.
        </p>

        <h3>8. Agreement &amp; Updates</h3>
        <p>
          By using Vendora, you agree to this policy and our Terms of Service.
          Vendora may update these policies when necessary and will provide
          appropriate notice of significant changes.
        </p>

        <p>
          Privacy Contact: [privacy@vendora.com]
          <br />
          Support: [support@vendora.com]
          <br />
          Company: Vendora [Legal Company Name]
        </p>
      </div>

      <form method="dialog" className="privacy-actions">
        <button className="privacy-btn">Close</button>
        <button className="privacy-btn privacy-btn-primary" onClick={onAgree}>
          I Agree
        </button>
      </form>
    </dialog>
  );
}

export function SwitchLink({ children, onClick }) {
  return (
    <button className="register-switch-link" type="button" onClick={onClick}>
      {children}
    </button>
  );
}
