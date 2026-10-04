import { useId, useState } from "react";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { loginAccount, verifyLoginOtp } from "../logic/auth";
import "../styles/LoginPage.css";

const PASSWORD_MAX = 16;

const validate = {
  email: (value) => {
    const text = value.trim();
    if (!text) return "Please enter your email address.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(text))
      return "Enter a valid email like you@example.com";
    return "";
  },
  password: (value) => {
    if (!value) return "Please enter your password.";
    if (value.length > PASSWORD_MAX)
      return `Password can be up to ${PASSWORD_MAX} characters.`;
    return "";
  },
};

export default function LoginPage({
  onLogin,
  onGoToRegister,
  onGoToForgotPassword,
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [otpMode, setOtpMode] = useState(false);
  const [otpEmail, setOtpEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpError, setOtpError] = useState("");

  const errors = {
    email: validate.email(email),
    password: validate.password(password),
  };
  const hasErrors = Boolean(errors.email || errors.password);

  const showError = (key) => (touched[key] || submitted ? errors[key] : "");
  const touch = (key) => setTouched((current) => ({ ...current, [key]: true }));

  const updateField = (setter) => (value) => {
    setter(value);
    setError("");
  };

  const submit = async (event) => {
    event.preventDefault();
    setSubmitted(true);

    if (hasErrors) {
      const form = event.currentTarget;
      setTimeout(() => form.querySelector('[aria-invalid="true"]')?.focus(), 0);
      return;
    }

    const result = await loginAccount({ email: email.trim(), password });
    if (result.error) return setError(result.error);
    if (result.otpRequired) {
      setOtpEmail(result.email);
      setOtpMode(true);
      return;
    }
    onLogin(result.account, remember);
  };

  const submitOtp = async (event) => {
    event.preventDefault();
    const result = await verifyLoginOtp(otpEmail, otpCode.trim());
    if (result.error) return setOtpError(result.error);
    onLogin(result.account, remember);
  };

  if (otpMode) {
    return (
      <main className="login-page">
        <section className="login-card">
          <div className="login-brand">
            <span className="login-brand-mark">V</span>
            <span>Vendora</span>
          </div>
          <header className="login-header">
            <h1>Check your email</h1>
            <p className="login-description">
              We sent a 6-digit code to {otpEmail}. Enter it below to finish
              signing in from this device.
            </p>
          </header>
          <form className="login-form" onSubmit={submitOtp} noValidate>
            <div className="login-field">
              <label className="login-label" htmlFor="otp-code">
                Verification code
              </label>
              <div className="login-input-wrap">
                <input
                  id="otp-code"
                  className="login-input"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otpCode}
                  onChange={(event) =>
                    setOtpCode(event.target.value.replace(/\D/g, ""))
                  }
                  placeholder="123456"
                  autoFocus
                />
              </div>
            </div>
            <p className="login-error" role={otpError ? "alert" : undefined}>
              {otpError}
            </p>
            <button className="login-submit" type="submit">
              Verify
            </button>
          </form>
          <p className="login-switch">
            <button
              className="login-switch-link"
              type="button"
              onClick={() => {
                setOtpMode(false);
                setOtpCode("");
                setOtpError("");
              }}
            >
              Back to login
            </button>
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-brand">
          <span className="login-brand-mark">V</span>
          <span>Vendora</span>
        </div>

        <header className="login-header">
          <h1>Welcome back</h1>
          <p className="login-description">
            Sign in to shop, sell, and manage your account.
          </p>
        </header>

        <form className="login-form" onSubmit={submit} noValidate>
          <LoginField
            label="Email Address"
            type="email"
            Icon={Mail}
            value={email}
            onChange={updateField(setEmail)}
            onBlur={() => touch("email")}
            error={showError("email")}
            placeholder="you@example.com"
            autoComplete="email"
          />
          <LoginField
            label="Password"
            type="password"
            Icon={Lock}
            maxLength={PASSWORD_MAX}
            value={password}
            onChange={updateField(setPassword)}
            onBlur={() => touch("password")}
            error={showError("password")}
            placeholder="Enter your password"
            autoComplete="current-password"
          />
          <div className="login-options">
            <LoginRemember checked={remember} onChange={setRemember} />
            <button
              type="button"
              className="login-switch-link"
              onClick={onGoToForgotPassword}
            >
              Forgot password?
            </button>
          </div>
          <p className="login-error" role={error ? "alert" : undefined}>
            {error}
          </p>
          <button className="login-submit" type="submit">
            Sign In
          </button>
        </form>

        <p className="login-switch">
          New to Vendora?{" "}
          <button
            className="login-switch-link"
            type="button"
            onClick={onGoToRegister}
          >
            Create an account
          </button>
        </p>
      </section>
    </main>
  );
}

function LoginField({
  label,
  type = "text",
  Icon,
  value,
  onChange,
  onBlur,
  error,
  placeholder,
  autoComplete,
  maxLength,
}) {
  const id = useId();
  const errorId = `${id}-error`;
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";

  return (
    <div className="login-field">
      <label className="login-label" htmlFor={id}>
        {label}
      </label>
      <div className="login-input-wrap">
        {Icon && <Icon className="login-input-icon" aria-hidden="true" />}
        <input
          id={id}
          className={`login-input ${isPassword ? "has-toggle" : ""} ${error ? "invalid" : ""}`}
          type={isPassword && showPassword ? "text" : type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          autoComplete={autoComplete}
          maxLength={maxLength}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={error ? errorId : undefined}
        />
        {isPassword && (
          <button
            type="button"
            className="login-toggle"
            onClick={() => setShowPassword((current) => !current)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
          >
            {showPassword ?
              <EyeOff size={16} />
            : <Eye size={16} />}
          </button>
        )}
      </div>
      {error && (
        <span id={errorId} className="login-field-error">
          {error}
        </span>
      )}
    </div>
  );
}

function LoginRemember({ checked, onChange }) {
  return (
    <label className="login-remember">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      Remember me
    </label>
  );
}
