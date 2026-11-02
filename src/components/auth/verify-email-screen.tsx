"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, LockKeyhole, MailCheck } from "lucide-react";
import { BrandMark } from "@/components/brand/brand-mark";
import { API_ENDPOINTS } from "@/config/api-endpoints";
import { ApiClientError, apiRequest } from "@/lib/api";

export function VerifyEmailScreen() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [secondsUntilResend, setSecondsUntilResend] = useState(0);
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    const updateCountdown = () => {
      const availableAt = Number(window.sessionStorage.getItem("otpResendAvailableAt") ?? 0);
      setSecondsUntilResend(Math.max(Math.ceil((availableAt - Date.now()) / 1000), 0));
    };
    const initialize = window.setTimeout(() => {
      setEmail(window.sessionStorage.getItem("pendingVerificationEmail") ?? "");
      updateCountdown();
    }, 0);
    const timer = window.setInterval(updateCountdown, 1000);
    return () => {
      window.clearTimeout(initialize);
      window.clearInterval(timer);
    };
  }, []);

  async function verify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await apiRequest(API_ENDPOINTS.AUTH.VERIFY_EMAIL, {
        method: "POST",
        body: JSON.stringify({ email: email.trim().toLowerCase(), otp }),
      });
      window.sessionStorage.removeItem("pendingVerificationEmail");
      window.sessionStorage.removeItem("otpResendAvailableAt");
      setComplete(true);
    } catch (requestError) {
      setError(requestError instanceof ApiClientError ? requestError.message : "We could not verify that code. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function resend() {
    setError("");
    setResending(true);
    try {
      await apiRequest(API_ENDPOINTS.AUTH.RESEND_VERIFICATION_OTP, {
        method: "POST",
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      window.sessionStorage.setItem("pendingVerificationEmail", email.trim().toLowerCase());
      window.sessionStorage.setItem("otpResendAvailableAt", String(Date.now() + 60_000));
      setSecondsUntilResend(60);
    } catch (requestError) {
      setError(requestError instanceof ApiClientError ? requestError.message : "We could not resend the code. Please try again.");
    } finally {
      setResending(false);
    }
  }

  return (
    <main className="auth-page">
      <aside className="auth-aside">
        <Link className="auth-brand" href="/" aria-label="The Cartel home"><BrandMark inverse /></Link>
        <div className="auth-aside__message">
          <p className="auth-eyebrow">Secure your account</p>
          <h2>One quick check before you join the conversation.</h2>
          <p>We verify every email to protect the quality and trust of The Cartel network.</p>
        </div>
        <p className="auth-aside__secure"><LockKeyhole size={14} /> Secure access to The Cartel</p>
      </aside>

      <div className="auth-content">
        <Link className="auth-back" href="/sign-up">← Back to sign up</Link>
        {complete ? (
          <section className="auth-success" aria-live="polite">
            <span><CheckCircle2 size={27} /></span>
            <p className="auth-eyebrow">Email confirmed</p>
            <h1>Your account is ready.</h1>
            <p>Your email has been verified and your secure session is now active.</p>
            <Link className="auth-primary" href="/">Continue to your feed <span>→</span></Link>
          </section>
        ) : (
          <section className="auth-form-panel">
            <span className="auth-verification-icon"><MailCheck size={24} /></span>
            <p className="auth-eyebrow">Check your inbox</p>
            <h1>Verify your email</h1>
            <p className="auth-description">Enter the six-digit code we sent you. The code expires in five minutes.</p>
            <form className="auth-form" onSubmit={verify}>
              <label className="auth-field" htmlFor="verification-email"><span>Email address</span><input id="verification-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
              <label className="auth-field" htmlFor="verification-code"><span>Verification code</span><input className="auth-otp-input" id="verification-code" type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="000000" required /></label>
              {error && <p className="auth-error" role="alert">{error}</p>}
              <button className="auth-primary" type="submit" disabled={submitting || otp.length !== 6}>{submitting ? "Verifying…" : "Verify email"}<span>→</span></button>
            </form>
            <p className="auth-resend">Didn’t receive the email? <button type="button" onClick={resend} disabled={resending || secondsUntilResend > 0 || !email}>{resending ? "Sending…" : secondsUntilResend > 0 ? `Resend in ${secondsUntilResend}s` : "Resend code"}</button></p>
          </section>
        )}
        <p className="auth-legal">© 2026 The Cartel · <Link href="/privacy">Privacy</Link> · <Link href="/terms">Terms</Link></p>
      </div>
    </main>
  );
}
