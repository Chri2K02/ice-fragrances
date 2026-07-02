"use client";
import { useState } from "react";

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });
      const d = await res.json();
      if (res.ok) setSent(true);
      else setError(d.error ?? "Could not send. Please try again.");
    } catch {
      setError("Could not send. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <p className="opacity-80">
        Thanks. Your message is on its way and we&apos;ll reply by email soon.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Your name (optional)"
        className="w-full rounded-lg border border-black/15 dark:border-white/20 bg-transparent px-3 py-2"
      />
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        type="email"
        placeholder="Your email"
        className="w-full rounded-lg border border-black/15 dark:border-white/20 bg-transparent px-3 py-2"
      />
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={5}
        placeholder="How can we help?"
        className="w-full rounded-lg border border-black/15 dark:border-white/20 bg-transparent px-3 py-2"
      />
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <button
        type="button"
        disabled={busy}
        onClick={submit}
        className="rounded-full px-5 py-2 font-medium text-black border-2 border-black disabled:opacity-40"
        style={{ background: "var(--accent)" }}
      >
        {busy ? "Sending…" : "Send message"}
      </button>
    </div>
  );
}
