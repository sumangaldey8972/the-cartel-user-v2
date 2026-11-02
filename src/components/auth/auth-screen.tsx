"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { CircleAlert, Eye, EyeOff, LockKeyhole, ShieldCheck } from "lucide-react";
import { FormEvent, useState } from "react";
import { BrandMark } from "@/components/brand/brand-mark";
import { API_ENDPOINTS } from "@/config/api-endpoints";
import { ApiClientError, apiRequest } from "@/lib/api";

type AuthMode = "sign-in" | "sign-up";
type SignUpField = "firstName" | "lastName" | "username" | "email" | "password" | "confirm-password" | "terms";
type FieldErrors = Partial<Record<SignUpField, string>>;

const signUpFieldOrder: SignUpField[] = ["firstName", "lastName", "username", "email", "password", "confirm-password", "terms"];

const authCopy = {
  "sign-in": {
    eyebrow: "Welcome back",
    title: "Sign in to The Cartel",
    description: "Return to the conversations shaping markets, business and culture.",
    submit: "Sign in",
    pending: "Signing in…",
    success: "You’re signed in.",
  },
  "sign-up": {
    eyebrow: "Join the network",
    title: "Create your account",
    description: "Follow credible voices, publish your perspective and join the market conversation.",
    submit: "Create account",
    pending: "Creating account…",
    success: "Your account is ready.",
  },
} as const;

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return <small className="auth-field-error" id={id}><CircleAlert size={12} aria-hidden="true" />{message}</small>;
}

type TextFieldProps = {
  id: string;
  name: string;
  label: string;
  type?: string;
  autoComplete: string;
  error?: string;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  title?: string;
  onChange?: () => void;
};

function TextField({ id, name, label, type = "text", autoComplete, error, onChange, ...inputProps }: TextFieldProps) {
  const errorId = `${id}-error`;
  return (
    <label className={`auth-field ${error ? "auth-field--error" : ""}`} htmlFor={id}>
      <span>{label}</span>
      <input id={id} name={name} type={type} autoComplete={autoComplete} aria-invalid={Boolean(error)} aria-describedby={error ? errorId : undefined} onChange={onChange} required {...inputProps} />
      <FieldError id={errorId} message={error} />
    </label>
  );
}

function PasswordField({ id, label, autoComplete, error, onChange }: { id: string; label: string; autoComplete: string; error?: string; onChange?: () => void }) {
  const [visible, setVisible] = useState(false);
  const errorId = `${id}-error`;

  return (
    <label className={`auth-field ${error ? "auth-field--error" : ""}`} htmlFor={id}>
      <span>{label}</span>
      <span className="auth-password">
        <input id={id} name={id} type={visible ? "text" : "password"} autoComplete={autoComplete} minLength={8} maxLength={72} aria-invalid={Boolean(error)} aria-describedby={error ? errorId : undefined} onChange={onChange} required />
        <button type="button" aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`} onClick={() => setVisible((value) => !value)}>
          {visible ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </span>
      <FieldError id={errorId} message={error} />
    </label>
  );
}

function validateSignUp(form: FormData): FieldErrors {
  const errors: FieldErrors = {};
  const firstName = String(form.get("firstName") ?? "").trim();
  const lastName = String(form.get("lastName") ?? "").trim();
  const username = String(form.get("username") ?? "").trim();
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  const confirmation = String(form.get("confirm-password") ?? "");

  if (!firstName) errors.firstName = "Enter your first name.";
  else if (firstName.length > 50) errors.firstName = "First name cannot exceed 50 characters.";
  if (!lastName) errors.lastName = "Enter your last name.";
  else if (lastName.length > 50) errors.lastName = "Last name cannot exceed 50 characters.";
  if (!username) errors.username = "Choose a username.";
  else if (username.length < 3) errors.username = "Username must contain at least 3 characters.";
  else if (!/^[a-z0-9_]+$/.test(username)) errors.username = "Use lowercase letters, numbers and underscores only.";
  if (!email) errors.email = "Enter your email address.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Enter a valid email address.";
  if (!password) errors.password = "Create a password.";
  else if (password.length < 8) errors.password = "Password must contain at least 8 characters.";
  else if (password.length > 72) errors.password = "Password cannot exceed 72 characters.";
  if (!confirmation) errors["confirm-password"] = "Confirm your password.";
  else if (confirmation !== password) errors["confirm-password"] = "The passwords do not match.";
  if (form.get("terms") !== "on") errors.terms = "Accept the Terms and Privacy Policy to continue.";
  return errors;
}

function focusFirstInvalidField(form: HTMLFormElement, errors: FieldErrors) {
  const firstInvalidField = signUpFieldOrder.find((field) => errors[field]);
  if (!firstInvalidField) return;
  window.requestAnimationFrame(() => {
    const control = form.elements.namedItem(firstInvalidField);
    if (!(control instanceof HTMLElement)) return;
    control.scrollIntoView({ behavior: "smooth", block: "center" });
    control.focus({ preventScroll: true });
  });
}

function fieldErrorsFromApi(error: ApiClientError): FieldErrors {
  const errors: FieldErrors = {};
  if (error.code === "VALIDATION_ERROR") {
    for (const field of signUpFieldOrder) {
      const messages = error.details?.[field];
      if (Array.isArray(messages) && typeof messages[0] === "string") errors[field] = messages[0];
    }
  }
  if (error.code === "ACCOUNT_ALREADY_EXISTS") {
    const field = error.details?.field;
    if (field === "email" || field === "username") errors[field] = error.message;
  }
  return errors;
}

function AuthForm({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const copy = authCopy[mode];
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [complete, setComplete] = useState(false);

  function clearFieldError(field: SignUpField) {
    setError("");
    setFieldErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const formElement = event.currentTarget;
    const form = new FormData(formElement);

    if (mode === "sign-up") {
      const validationErrors = validateSignUp(form);
      setFieldErrors(validationErrors);
      if (Object.keys(validationErrors).length > 0) {
        focusFirstInvalidField(formElement, validationErrors);
        return;
      }
    }

    setSubmitting(true);
    try {
      if (mode === "sign-up") {
        const email = String(form.get("email") ?? "").trim().toLowerCase();
        await apiRequest(API_ENDPOINTS.AUTH.SIGN_UP, {
          method: "POST",
          body: JSON.stringify({
            firstName: String(form.get("firstName") ?? "").trim(),
            lastName: String(form.get("lastName") ?? "").trim(),
            username: String(form.get("username") ?? "").trim(),
            email,
            password: String(form.get("password") ?? ""),
          }),
        });
        window.sessionStorage.setItem("pendingVerificationEmail", email);
        window.sessionStorage.setItem("otpResendAvailableAt", String(Date.now() + 60_000));
        router.push("/verify-email");
        return;
      }

      await apiRequest(API_ENDPOINTS.AUTH.SIGN_IN, {
        method: "POST",
        body: JSON.stringify({
          identifier: String(form.get("email") ?? "").trim(),
          password: String(form.get("password") ?? ""),
        }),
      });
      setComplete(true);
    } catch (requestError) {
      if (mode === "sign-up" && requestError instanceof ApiClientError && requestError.code === "ACCOUNT_PENDING_VERIFICATION") {
        const email = String(form.get("email") ?? "").trim().toLowerCase();
        window.sessionStorage.setItem("pendingVerificationEmail", email);
        router.push("/verify-email");
        return;
      }
      if (mode === "sign-up" && requestError instanceof ApiClientError) {
        const backendFieldErrors = fieldErrorsFromApi(requestError);
        if (Object.keys(backendFieldErrors).length > 0) {
          setFieldErrors(backendFieldErrors);
          focusFirstInvalidField(formElement, backendFieldErrors);
          return;
        }
      }
      setError(requestError instanceof ApiClientError ? requestError.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (complete) {
    return (
      <section className="auth-success" aria-live="polite">
        <span><ShieldCheck size={27} /></span>
        <p className="auth-eyebrow">Access confirmed</p>
        <h1>{copy.success}</h1>
        <p>Your secure session is active. You can continue to your feed.</p>
        <Link className="auth-primary" href="/">Continue to your feed <span>→</span></Link>
      </section>
    );
  }

  return (
    <section className="auth-form-panel">
      <p className="auth-eyebrow">{copy.eyebrow}</p>
      <h1>{copy.title}</h1>
      <p className="auth-description">{copy.description}</p>

      <form className="auth-form" onSubmit={submit} noValidate={mode === "sign-up"}>
        {mode === "sign-up" && (
          <>
            <div className="auth-field-row">
              <TextField id="first-name" name="firstName" label="First name" autoComplete="given-name" maxLength={50} error={fieldErrors.firstName} onChange={() => clearFieldError("firstName")} />
              <TextField id="last-name" name="lastName" label="Last name" autoComplete="family-name" maxLength={50} error={fieldErrors.lastName} onChange={() => clearFieldError("lastName")} />
            </div>
            <TextField id="username" name="username" label="Username" autoComplete="username" minLength={3} maxLength={30} pattern="[a-z0-9_]+" title="Use lowercase letters, numbers, and underscores" error={fieldErrors.username} onChange={() => clearFieldError("username")} />
          </>
        )}

        <TextField id="email" name="email" label={mode === "sign-in" ? "Email or username" : "Email address"} type={mode === "sign-in" ? "text" : "email"} autoComplete={mode === "sign-in" ? "username" : "email"} error={mode === "sign-up" ? fieldErrors.email : undefined} onChange={mode === "sign-up" ? () => clearFieldError("email") : undefined} />

        <PasswordField id="password" label="Password" autoComplete={mode === "sign-in" ? "current-password" : "new-password"} error={mode === "sign-up" ? fieldErrors.password : undefined} onChange={mode === "sign-up" ? () => { clearFieldError("password"); clearFieldError("confirm-password"); } : undefined} />
        {mode === "sign-up" && <PasswordField id="confirm-password" label="Confirm password" autoComplete="new-password" error={fieldErrors["confirm-password"]} onChange={() => clearFieldError("confirm-password")} />}

        {mode === "sign-in" ? (
          <div className="auth-form-options">
            <label className="auth-check"><input type="checkbox" name="remember" /><span>Remember me</span></label>
            <Link href="/forgot-password">Forgot password?</Link>
          </div>
        ) : (
          <div className={`auth-terms-wrap ${fieldErrors.terms ? "auth-terms-wrap--error" : ""}`}>
            <label className="auth-check auth-terms">
              <input type="checkbox" name="terms" aria-invalid={Boolean(fieldErrors.terms)} aria-describedby={fieldErrors.terms ? "terms-error" : undefined} onChange={() => clearFieldError("terms")} required />
              <span>I agree to the <Link href="/terms">Terms</Link> and <Link href="/privacy">Privacy Policy</Link>.</span>
            </label>
            <FieldError id="terms-error" message={fieldErrors.terms} />
          </div>
        )}

        {error && <p className="auth-error" role="alert">{error}</p>}
        <button className="auth-primary" type="submit" disabled={submitting}>
          {submitting ? copy.pending : copy.submit}<span>→</span>
        </button>
      </form>

      <p className="auth-switch">
        {mode === "sign-in" ? "New to The Cartel?" : "Already have an account?"}{" "}
        <Link href={mode === "sign-in" ? "/sign-up" : "/sign-in"}>{mode === "sign-in" ? "Create an account" : "Sign in"}</Link>
      </p>
    </section>
  );
}

export function AuthScreen({ mode }: { mode: AuthMode }) {
  return (
    <main className="auth-page">
      <aside className="auth-aside">
        <Link className="auth-brand" href="/" aria-label="The Cartel home"><BrandMark inverse /></Link>
        <div className="auth-aside__message">
          <p className="auth-eyebrow">The market conversation</p>
          <h2>Know what moves markets—and why.</h2>
          <p>News, analysis and perspective from the people closest to the story.</p>
        </div>
        <div className="auth-signal" aria-label="Live market signals">
          <div><span>BTC</span><strong>$67,482</strong><em>+1.48%</em></div>
          <div><span>NASDAQ</span><strong>18,614</strong><em className="negative">−0.18%</em></div>
        </div>
        <p className="auth-aside__secure"><LockKeyhole size={14} /> Secure access to The Cartel</p>
      </aside>

      <div className="auth-content">
        <Link className="auth-back" href="/">← Back to the feed</Link>
        <AuthForm mode={mode} />
        <p className="auth-legal">© 2026 The Cartel · <Link href="/privacy">Privacy</Link> · <Link href="/terms">Terms</Link></p>
      </div>
    </main>
  );
}
