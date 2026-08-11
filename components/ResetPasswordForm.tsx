"use client";
import { useState } from "react";
import Link from "next/link";

const input =
  "w-full rounded-lg border border-black/15 dark:border-white/20 bg-transparent px-3 py-2.5 text-sm";
const primaryBtn =
  "mt-1 w-full rounded-full px-4 py-3 font-medium text-black border-2 border-black disabled:opacity-40";

// Two-step reset over /api/account/reset-password, which scrubs its responses
// so nothing here can reveal whether an email has an account: step one always
// advances with the same neutral message.
export function ResetPasswordForm() {
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function post(body: Record<string, unknown>) {
    const res = await fetch("/api/account/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).catch(() => null);
    const data = (await res?.json().catch(() => null)) as
      | { ok?: boolean; error?: string }
      | null;
    return { ok: !!res?.ok, error: data?.error };
  }

  async function requestCode(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    await post({ action: "request", email });
    setBusy(false);
    setStep("code");
  }

  async function submitReset(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { ok, error } = await post({
      action: "reset",
      email,
      otp,
      password,
    });
    setBusy(false);
    if (ok) setDone(true);
    else setError(error ?? "Something went wrong. Please try again.");
  }

  if (done) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm">
          Your password has been reset. You can sign in with it now.
        </p>
        <Link
          href="/sign-in"
          className="rounded-full px-4 py-3 font-medium text-black border-2 border-black text-center"
          style={{ background: "var(--accent)" }}
        >
          Go to sign in
        </Link>
      </div>
    );
  }

  if (step === "code") {
    return (
      <form onSubmit={submitReset} className="flex flex-col gap-3">
        <p className="text-sm opacity-70">
          If <strong>{email}</strong> has an account, a 6-digit code is on its
          way. Enter it with your new password.
        </p>
        <input
          className={input}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          placeholder="6-digit code"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          required
        />
        <input
          className={input}
          type="password"
          autoComplete="new-password"
          placeholder="New password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button
          type="submit"
          disabled={busy || otp.length < 6 || password.length < 8}
          className={primaryBtn}
          style={{ background: "var(--accent)" }}
        >
          {busy ? "Resetting…" : "Set new password"}
        </button>
        <button
          type="button"
          onClick={() => {
            setStep("email");
            setError(null);
          }}
          className="text-sm opacity-60 hover:opacity-100"
        >
          Use a different email
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={requestCode} className="flex flex-col gap-3">
      <input
        className={input}
        type="email"
        autoComplete="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <button
        type="submit"
        disabled={busy || !email}
        className={primaryBtn}
        style={{ background: "var(--accent)" }}
      >
        {busy ? "Sending…" : "Email me a code"}
      </button>
      <Link
        href="/sign-in"
        className="text-sm opacity-60 hover:opacity-100 text-center"
      >
        Back to sign in
      </Link>
    </form>
  );
}
