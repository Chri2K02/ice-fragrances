const RESEND_API_KEY = process.env.RESEND_API_KEY;
// Until the domain is verified in Resend, "onboarding@resend.dev" works for
// sending to your own address. After verification, set EMAIL_FROM to
// "Ice Fragrances <orders@icefragrances.com>".
const EMAIL_FROM =
  process.env.EMAIL_FROM ?? "Ice Fragrances <onboarding@resend.dev>";

// Sends an email via Resend. No-op until RESEND_API_KEY is configured.
// Never throws — email must never break the webhook.
export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}): Promise<void> {
  if (!RESEND_API_KEY) return;
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        // Supports a comma-separated list of recipients.
        to: opts.to
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        subject: opts.subject,
        html: opts.html,
        reply_to: opts.replyTo,
      }),
    });
  } catch {
    /* swallow — never break the order over a notification email */
  }
}
