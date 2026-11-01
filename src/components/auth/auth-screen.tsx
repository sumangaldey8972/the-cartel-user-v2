"use client";

import Link from "next/link";
import { Eye, EyeOff, LockKeyhole, ShieldCheck } from "lucide-react";
import { FormEvent, useState } from "react";
import { BrandMark } from "@/components/brand/brand-mark";

type AuthMode = "sign-in" | "sign-up";

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

function PasswordField({ id, label, autoComplete }: { id: string; label: string; autoComplete: string }) {
  const [visible, setVisible] = useState(false);

  return (
    <label className="auth-field" htmlFor={id}>
      <span>{label}</span>
      <span className="auth-password">
        <input id={id} name={id} type={visible ? "text" : "password"} autoComplete={autoComplete} minLength={8} required />
        <button type="button" aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`} onClick={() => setVisible((value) => !value)}>
          {visible ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </span>
    </label>
  );
}

function AuthForm({ mode }: { mode: AuthMode }) {
  const copy = authCopy[mode];
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [complete, setComplete] = useState(false);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);

    if (mode === "sign-up" && form.get("password") !== form.get("confirm-password")) {
      setError("The passwords do not match.");
      return;
    }

    setSubmitting(true);
    window.setTimeout(() => {
      setSubmitting(false);
      setComplete(true);
    }, 650);
  }

  if (complete) {
    return (
      <section className="auth-success" aria-live="polite">
        <span><ShieldCheck size={27} /></span>
        <p className="auth-eyebrow">Access confirmed</p>
        <h1>{copy.success}</h1>
        <p>This frontend prototype is ready. Account persistence will be connected when the authentication backend is added.</p>
        <Link className="auth-primary" href="/">Continue to your feed <span>→</span></Link>
      </section>
    );
  }

  return (
    <section className="auth-form-panel">
      <p className="auth-eyebrow">{copy.eyebrow}</p>
      <h1>{copy.title}</h1>
      <p className="auth-description">{copy.description}</p>

      <form className="auth-form" onSubmit={submit}>
        {mode === "sign-up" && (
          <div className="auth-field-row">
            <label className="auth-field" htmlFor="full-name"><span>Full name</span><input id="full-name" name="full-name" type="text" autoComplete="name" required /></label>
            <label className="auth-field" htmlFor="username"><span>Username</span><input id="username" name="username" type="text" autoComplete="username" required /></label>
          </div>
        )}

        <label className="auth-field" htmlFor="email">
          <span>{mode === "sign-in" ? "Email or username" : "Email address"}</span>
          <input id="email" name="email" type={mode === "sign-in" ? "text" : "email"} autoComplete={mode === "sign-in" ? "username" : "email"} required />
        </label>

        <PasswordField id="password" label="Password" autoComplete={mode === "sign-in" ? "current-password" : "new-password"} />
        {mode === "sign-up" && <PasswordField id="confirm-password" label="Confirm password" autoComplete="new-password" />}

        {mode === "sign-in" ? (
          <div className="auth-form-options">
            <label className="auth-check"><input type="checkbox" name="remember" /><span>Remember me</span></label>
            <Link href="/forgot-password">Forgot password?</Link>
          </div>
        ) : (
          <label className="auth-check auth-terms">
            <input type="checkbox" name="terms" required />
            <span>I agree to the <Link href="/terms">Terms</Link> and <Link href="/privacy">Privacy Policy</Link>.</span>
          </label>
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
