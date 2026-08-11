"use client";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useToast } from "@/lib/toastStore";

const input =
  "w-full rounded-lg border border-black/15 dark:border-white/20 bg-transparent px-3 py-2.5 text-sm";
const primaryBtn =
  "rounded-full px-4 py-2.5 text-sm font-medium text-black border-2 border-black disabled:opacity-40";
const ghostBtn =
  "rounded-full px-4 py-2.5 text-sm font-medium border border-black/20 dark:border-white/25 hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-40";

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl p-5" style={{ background: "var(--card)" }}>
      <h2 className="text-lg font-semibold mb-4">{title}</h2>
      {children}
    </section>
  );
}

export function AccountManager({
  name,
  email,
  hasPassword,
  google,
  canUnlinkGoogle,
}: {
  name: string;
  email: string;
  hasPassword: boolean;
  google: boolean;
  canUnlinkGoogle: boolean;
}) {
  const toast = useToast((s) => s.show);

  // ── Display name ─────────────────────────────────────────────
  const [displayName, setDisplayName] = useState(name);
  const [savingName, setSavingName] = useState(false);
  async function saveName(e: React.FormEvent) {
    e.preventDefault();
    setSavingName(true);
    const { error } = await authClient.updateUser({ name: displayName.trim() });
    setSavingName(false);
    toast(error ? "Couldn't update your name." : "Name updated.");
  }

  // ── Password: change (has one) OR set via reset OTP (Google-only) ──
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [savingPw, setSavingPw] = useState(false);
  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setSavingPw(true);
    const { error } = await authClient.changePassword({
      currentPassword: current,
      newPassword: next,
      revokeOtherSessions: true,
    });
    setSavingPw(false);
    if (error) {
      toast("Couldn't change password — check your current one.");
    } else {
      setCurrent("");
      setNext("");
      toast("Password changed. Other sessions signed out.");
    }
  }

  // Google-only users have no password. They're already authenticated by
  // their session, so setPassword needs no email round-trip — one field.
  const [newPw, setNewPw] = useState("");
  const [busySet, setBusySet] = useState(false);
  async function setPassword(e: React.FormEvent) {
    e.preventDefault();
    setBusySet(true);
    const res = await fetch("/api/account/set-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: newPw }),
    }).catch(() => null);
    setBusySet(false);
    if (res?.ok) {
      setNewPw("");
      toast("Password set. Reload to manage it.");
    } else {
      toast("Couldn't set a password on this account.");
    }
  }

  // ── Link / unlink Google ─────────────────────────────────────
  const [busyLink, setBusyLink] = useState(false);
  async function linkGoogle() {
    setBusyLink(true);
    // Full-page redirect to Google; returns to the account page.
    await authClient.linkSocial({ provider: "google", callbackURL: "/account" });
  }
  async function unlinkGoogle() {
    if (!canUnlinkGoogle) return;
    if (!confirm("Unlink your Google account? You'll sign in with email and password.")) return;
    setBusyLink(true);
    const { error } = await authClient.unlinkAccount({ providerId: "google" });
    setBusyLink(false);
    toast(error ? "Couldn't unlink Google." : "Google unlinked.");
    if (!error) window.location.reload();
  }

  return (
    <div className="space-y-6">
      <Card title="Profile">
        <form onSubmit={saveName} className="flex flex-col gap-3">
          <label className="text-sm opacity-70" htmlFor="acct-name">
            Display name
          </label>
          <div className="flex gap-2">
            <input
              id="acct-name"
              className={input}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              autoComplete="name"
            />
            <button
              type="submit"
              disabled={savingName || !displayName.trim() || displayName.trim() === name}
              className={primaryBtn}
              style={{ background: "var(--accent)" }}
            >
              {savingName ? "Saving…" : "Save"}
            </button>
          </div>
          <p className="text-sm opacity-60">
            Signed in as <strong>{email}</strong>.
          </p>
        </form>
      </Card>

      <Card title={hasPassword ? "Change password" : "Set a password"}>
        {hasPassword ? (
          <form onSubmit={changePassword} className="flex flex-col gap-3">
            <input
              className={input}
              type="password"
              autoComplete="current-password"
              placeholder="Current password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              required
            />
            <input
              className={input}
              type="password"
              autoComplete="new-password"
              placeholder="New password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              required
              minLength={8}
            />
            <button
              type="submit"
              disabled={savingPw || !current || next.length < 8}
              className={`${primaryBtn} self-start`}
              style={{ background: "var(--accent)" }}
            >
              {savingPw ? "Changing…" : "Change password"}
            </button>
          </form>
        ) : (
          <form onSubmit={setPassword} className="flex flex-col gap-3">
            <p className="text-sm opacity-70">
              You sign in with Google. Add a password so you can also sign in
              with your email.
            </p>
            <input
              className={input}
              type="password"
              autoComplete="new-password"
              placeholder="New password"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              required
              minLength={8}
            />
            <button
              type="submit"
              disabled={busySet || newPw.length < 8}
              className={`${primaryBtn} self-start`}
              style={{ background: "var(--accent)" }}
            >
              {busySet ? "Setting…" : "Set password"}
            </button>
          </form>
        )}
      </Card>

      <Card title="Connected accounts">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium">Google</p>
            <p className="text-sm opacity-60">
              {google ? "Connected" : "Not connected"}
            </p>
          </div>
          {google ? (
            <button
              type="button"
              onClick={unlinkGoogle}
              disabled={busyLink || !canUnlinkGoogle}
              title={
                canUnlinkGoogle
                  ? undefined
                  : "Set a password first so you keep a way to sign in."
              }
              className={ghostBtn}
            >
              Unlink
            </button>
          ) : (
            <button
              type="button"
              onClick={linkGoogle}
              disabled={busyLink}
              className={ghostBtn}
            >
              {busyLink ? "Redirecting…" : "Link Google"}
            </button>
          )}
        </div>
        {google && !canUnlinkGoogle && (
          <p className="text-sm opacity-60 mt-3">
            Set a password above before unlinking, so you keep a way in.
          </p>
        )}
      </Card>
    </div>
  );
}
