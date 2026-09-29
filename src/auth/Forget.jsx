import { useId, useRef, useState } from "react";
import { ChevronLeft, Eye, EyeOff, Lock, Mail, BadgeCheck } from "lucide-react";
import {
  requestPasswordReset,
  verifyResetCode,
  confirmPasswordReset,
} from "../logic/auth";
import "../styles/LoginPage.css";

const PASSWORD_MAX = 16;

export default function ForgetPass({ onBackToLogin }) {
  const [resetStep, setResetStep] = useState("email");
  const [resetEmail, setResetEmail] = useState("");
  const [pin, setPin] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const pinRefs = useRef([]);

  const back = () => {
    setError("");
    if (resetStep === "email") {
      onBackToLogin?.();
      return;
    }
    if (resetStep === "code") return setResetStep("email");
    if (resetStep === "password") return setResetStep("code");
    setResetStep("login");
  };

  const sendCode = async (event) => {
    event.preventDefault();
    setError("");

    const text = resetEmail.trim();
    if (!text) return setError("Please enter your email address.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(text))
      return setError("Enter a valid email like you@example.com");

    const result = await requestPasswordReset(text);
    if (result.error) return setError(result.error);

    setResetStep("code");
    setTimeout(() => pinRefs.current[0]?.focus(), 0);
  };

  const updatePin = (index, value) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...pin];
    next[index] = digit;
    setPin(next);

    if (digit && index < pin.length - 1) {
      pinRefs.current[index + 1]?.focus();
    }

    if (next.every((d) => d)) {
      verifyResetCode(resetEmail.trim(), next.join("")).then((result) => {
        if (result.error) {
          setError(result.error);
          return;
        }
        setError("");
        setResetStep("password");
      });
    }
  };

  const resetPassword = async (event) => {
    event.preventDefault();
    setError("");

    if (!newPassword) return setError("Please create a new password.");
    if (newPassword.length < 6)
      return setError("Password must be at least 6 characters.");
    if (newPassword.length > PASSWORD_MAX)
      return setError(`Password can be up to ${PASSWORD_MAX} characters.`);
    if (newPassword !== confirmPassword)
      return setError("Passwords do not match.");

    const code = pin.join("");
    const result = await confirmPasswordReset(
      resetEmail.trim(),
      code,
      newPassword,
    );
    if (result.error) return setError(result.error);

    setResetStep("success");
  };

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-brand">
          <span className="login-brand-mark">V</span>
          <span>Vendora</span>
        </div>

        <div className="login-reset" key={resetStep}>
          <button className="login-back" type="button" onClick={back}>
            <ChevronLeft size={16} /> Back to{" "}
            {resetStep === "email" ? "sign in" : "previous step"}
          </button>

          {resetStep === "email" && (
            <>
              <h1>Reset your password</h1>
              <p className="login-description">
                Enter your email and we&rsquo;ll send a verification code.
              </p>
              <form className="login-form" onSubmit={sendCode} noValidate>
                <Field
                  label="Email Address"
                  type="email"
                  Icon={Mail}
                  value={resetEmail}
                  onChange={setResetEmail}
                  placeholder="you@example.com"
                  autoComplete="email"
                />
                {error && <p className="login-error">{error}</p>}
                <button className="login-submit" type="submit">
                  Send verification code
                </button>
              </form>
            </>
          )}

          {resetStep === "code" && (
            <>
              <h1>Check your email</h1>
              <p className="login-description">
                A verification code has been sent to <b>{resetEmail}</b>.
              </p>
              <div
                className="login-pin"
                aria-label="Six digit verification code"
              >
                {pin.map((digit, index) => (
                  <input
                    key={index}
                    ref={(element) => {
                      pinRefs.current[index] = element;
                    }}
                    value={digit}
                    onChange={(event) => updatePin(index, event.target.value)}
                    onKeyDown={(event) =>
                      event.key === "Backspace" &&
                      !digit &&
                      index > 0 &&
                      pinRefs.current[index - 1]?.focus()
                    }
                    inputMode="numeric"
                    maxLength="1"
                    aria-label={`Digit ${index + 1}`}
                  />
                ))}
              </div>
              <p className="login-helper">
                Enter any six digits to continue in this demo.
              </p>
            </>
          )}

          {resetStep === "password" && (
            <>
              <h1>Create a new password</h1>
              <p className="login-description">
                Use at least six characters and keep it somewhere safe.
              </p>
              <form className="login-form" onSubmit={resetPassword} noValidate>
                <PasswordField
                  label="New password"
                  value={newPassword}
                  onChange={setNewPassword}
                  show={showPassword}
                  onToggle={() => setShowPassword(!showPassword)}
                />
                <PasswordField
                  label="Confirm new password"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  show={showPassword}
                  onToggle={() => setShowPassword(!showPassword)}
                />
                {error && <p className="login-error">{error}</p>}
                <button className="login-submit" type="submit">
                  Save new password
                </button>
              </form>
            </>
          )}

          {resetStep === "success" && (
            <div className="login-success">
              <BadgeCheck size={36} />
              <h1>Password updated</h1>
              <p>
                Your password has been updated. You can now sign in with it.
              </p>
              <button
                className="login-submit"
                onClick={() => onBackToLogin?.()}
              >
                Return to sign in
              </button>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function Field({
  label,
  type = "text",
  Icon,
  value,
  onChange,
  placeholder,
  autoComplete,
}) {
  const id = useId();
  return (
    <div className="login-field">
      <label className="login-label" htmlFor={id}>
        {label}
      </label>
      <div className="login-input-wrap">
        {Icon && <Icon className="login-input-icon" aria-hidden="true" />}
        <input
          id={id}
          className="login-input"
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
        />
      </div>
    </div>
  );
}

function PasswordField({ label, value, onChange, show, onToggle }) {
  const id = useId();
  return (
    <div className="login-field">
      <label className="login-label" htmlFor={id}>
        {label}
      </label>
      <div className="login-input-wrap">
        <Lock className="login-input-icon" aria-hidden="true" />
        <input
          id={id}
          className="login-input has-toggle"
          type={show ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          maxLength={PASSWORD_MAX}
          autoComplete="new-password"
        />
        <button
          type="button"
          className="login-toggle"
          onClick={onToggle}
          aria-label={show ? "Hide password" : "Show password"}
          aria-pressed={show}
        >
          {show ?
            <EyeOff size={16} />
          : <Eye size={16} />}
        </button>
      </div>
    </div>
  );
}
