"use client";

import { useState } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";

type Mode = "signin" | "signup";

const input =
  "w-full rounded-lg border border-black/15 dark:border-white/20 bg-transparent px-3 py-2.5 text-sm";

const primaryBtn =
  "mt-1 w-full rounded-full px-4 py-3 font-medium text-black border-2 border-black disabled:opacity-40";

export function AuthForm({ mode }: { mode: Mode }) {
  const isSignup = mode === "signup";

  // Sign-up has a second step: Better Auth auto-emails a 6-digit code on
  // signup (sendVerificationOnSignUp), so we collect it before redirecting.
  const [step, setStep] = useState<"form" | "verify">("form");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGoogle() {
    setError(null);
    setLoading(true);
    // Full-page redirect to Google; better-auth handles the callback.
    const { error } = await authClient.signIn.social({
      provider: "google",
      callbackURL: "/",
    });
    if (error) {
      setError(error.message ?? "Google sign-in failed.");
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (isSignup) {
        const { error } = await authClient.signUp.email({
          name,
          email,
          password,
        });
        if (error) {
          setError(error.message ?? "Could not create account.");
        } else {
          // OTP was auto-sent — move to the code-entry step.
          setStep("verify");
        }
      } else {
        const { error } = await authClient.signIn.email({ email, password });
        if (error) {
          setError(error.message ?? "Could not sign in.");
        } else {
          // Hard navigation so server components re-render against the new
          // session cookie (not just the store-based useSession in Header).
          window.location.href = "/";
          return;
        }
      }
    } catch {
      setError("Something went wrong. Please try again.");
    }
    setLoading(false);
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { error: verifyError } = await authClient.emailOtp.verifyEmail({
        email,
        otp,
      });
      if (verifyError) {
        setError(verifyError.message ?? "Invalid or expired code.");
        setLoading(false);
        return;
      }
      // verifyEmail only establishes a session when the auth config sets
      // emailVerification.autoSignInAfterVerification — ours doesn't — so the
      // user would otherwise land logged out. Explicitly sign in with the
      // password we still hold (now permitted: requireEmailVerification is
      // satisfied because the email was just verified).
      const { error: signInError } = await authClient.signIn.email({
        email,
        password,
      });
      if (signInError) {
        // Verified but auto sign-in failed — send them to sign in manually.
        window.location.href = "/sign-in";
        return;
      }
      window.location.href = "/";
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  if (isSignup && step === "verify") {
    return (
      <form onSubmit={handleVerify} className="flex flex-col gap-3 w-full">
        <p className="text-sm opacity-70">
          We emailed a 6-digit code to <strong>{email}</strong>. Enter it to
          confirm your account.
        </p>
        <input
          className={input}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          placeholder="6-digit code"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          required
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button
          type="submit"
          disabled={loading || otp.length < 6}
          className={primaryBtn}
          style={{ background: "var(--accent)" }}
        >
          {loading ? "Verifying…" : "Verify email"}
        </button>
        <button
          type="button"
          onClick={() => {
            setStep("form");
            setError(null);
          }}
          className="text-sm opacity-60 hover:opacity-100"
        >
          ‹ Back
        </button>
      </form>
    );
  }

  return (
    <div className="flex flex-col gap-4 w-full">
      <button
        type="button"
        onClick={handleGoogle}
        disabled={loading}
        className="w-full rounded-full px-4 py-3 text-sm font-medium border border-black/20 dark:border-white/25 flex items-center justify-center gap-2 hover:opacity-80 disabled:opacity-40"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        Continue with Google
      </button>

      <div className="flex items-center gap-3 text-xs opacity-50">
        <span className="h-px flex-1 bg-current" />
        or
        <span className="h-px flex-1 bg-current" />
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {isSignup && (
          <input
            className={input}
            type="text"
            autoComplete="name"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        )}
        <input
          className={input}
          type="email"
          autoComplete="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          className={input}
          type="password"
          autoComplete={isSignup ? "new-password" : "current-password"}
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className={primaryBtn}
          style={{ background: "var(--accent)" }}
        >
          {loading
            ? isSignup
              ? "Creating account…"
              : "Signing in…"
            : isSignup
              ? "Create account"
              : "Sign in"}
        </button>
      </form>

      <p className="text-sm opacity-70 text-center">
        {isSignup ? (
          <>
            Already have an account?{" "}
            <Link href="/sign-in" className="underline">
              Sign in
            </Link>
          </>
        ) : (
          <>
            New here?{" "}
            <Link href="/sign-up" className="underline">
              Create an account
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
