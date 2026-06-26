const RESEND_API_KEY = process.env.RESEND_API_KEY;
// Until the domain is verified in Resend, "onboarding@resend.dev" works for
// sending to your own address. After verification, set EMAIL_FROM to
// "Ice Fragrances <orders@icefragrances.com>".
const EMAIL_FROM =
  process.env.EMAIL_FROM ?? "Ice Fragrances <onboarding@resend.dev>";

const ACCENT = "#34b6f5";

// Branded customer-facing order confirmation. Shared by the Stripe webhook
// (auto-sent on every new order) and the manual resend tool.
export function customerConfirmationHtml(
  name: string | null,
  itemLines: string[]
): string {
  const greeting = name ? `Hi ${name.split(" ")[0]},` : "Hi there,";
  const items = itemLines
    .map((l) => `<li style="margin:4px 0">${l}</li>`)
    .join("");
  return `
  <div style="background:#0a0a0a;padding:32px 0;font-family:Helvetica,Arial,sans-serif">
    <div style="max-width:480px;margin:0 auto;background:#111;border:1px solid #1f1f1f;border-radius:16px;overflow:hidden">
      <div style="padding:28px 32px;border-bottom:1px solid #1f1f1f">
        <h1 style="margin:0;color:#fff;font-size:20px;letter-spacing:0.18em;text-transform:uppercase">Ice&nbsp;Fragrances</h1>
      </div>
      <div style="padding:28px 32px;color:#e8e8e8;font-size:15px;line-height:1.6">
        <p style="margin:0 0 16px">${greeting}</p>
        <p style="margin:0 0 16px">Thank you for your order — it's official, and we couldn't be more glad to have you wearing Ice.</p>
        <p style="margin:0 0 8px;color:#9a9a9a;font-size:13px;text-transform:uppercase;letter-spacing:0.12em">Your order</p>
        <ul style="margin:0 0 20px;padding-left:20px;color:#fff">${items}</ul>
        <p style="margin:0 0 16px">Your pieces are being prepared with care and will arrive within <strong style="color:${ACCENT}">5–7 business days</strong>. We'll reach out if anything needs your attention along the way.</p>
        <p style="margin:0 0 20px">Have a question about your order? Just reply to this email — a real person reads every one.</p>
        <p style="margin:0;color:#9a9a9a">Stay cool,<br/>The Ice Fragrances team</p>
      </div>
      <div style="padding:18px 32px;border-top:1px solid #1f1f1f;color:#5f5f5f;font-size:12px">
        icefragrances.com
      </div>
    </div>
  </div>`;
}

// One-time passcode email for Better Auth's emailOTP plugin (sign-in,
// email verification, password reset). Branded to match the order email.
export function otpEmailHtml(otp: string): string {
  const code = otp.replace(/[^0-9A-Za-z]/g, "");
  return `
  <div style="background:#0a0a0a;padding:32px 0;font-family:Helvetica,Arial,sans-serif">
    <div style="max-width:480px;margin:0 auto;background:#111;border:1px solid #1f1f1f;border-radius:16px;overflow:hidden">
      <div style="padding:28px 32px;border-bottom:1px solid #1f1f1f">
        <h1 style="margin:0;color:#fff;font-size:20px;letter-spacing:0.18em;text-transform:uppercase">Ice&nbsp;Fragrances</h1>
      </div>
      <div style="padding:28px 32px;color:#e8e8e8;font-size:15px;line-height:1.6">
        <p style="margin:0 0 16px">Use this code to continue:</p>
        <p style="margin:0 0 20px;text-align:center">
          <span style="display:inline-block;font-size:32px;font-weight:bold;letter-spacing:0.32em;color:${ACCENT};background:#0a0a0a;border:1px solid #1f1f1f;border-radius:12px;padding:16px 24px">${code}</span>
        </p>
        <p style="margin:0 0 16px">This code expires in <strong style="color:${ACCENT}">5 minutes</strong>. If you didn't request it, you can safely ignore this email.</p>
        <p style="margin:0;color:#9a9a9a">Stay cool,<br/>The Ice Fragrances team</p>
      </div>
      <div style="padding:18px 32px;border-top:1px solid #1f1f1f;color:#5f5f5f;font-size:12px">
        icefragrances.com
      </div>
    </div>
  </div>`;
}

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
