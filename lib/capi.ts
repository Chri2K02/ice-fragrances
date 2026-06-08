import crypto from "crypto";

const DATASET = process.env.NEXT_PUBLIC_FB_PIXEL_ID;
const TOKEN = process.env.META_CAPI_TOKEN;
const GRAPH = "https://graph.facebook.com/v21.0";

function hash(value?: string | null): string | undefined {
  if (!value) return undefined;
  return crypto
    .createHash("sha256")
    .update(value.trim().toLowerCase())
    .digest("hex");
}

export type CapiUserData = {
  email?: string | null;
  fbp?: string | null;
  fbc?: string | null;
  clientIp?: string | null;
  userAgent?: string | null;
};

export type CapiEvent = {
  eventName: string;
  eventId?: string;
  eventSourceUrl?: string;
  userData: CapiUserData;
  customData?: Record<string, unknown>;
  actionSource?: "website";
};

// Server-to-server event to Meta Conversions API. No-op until configured.
// Never throws — tracking must never break checkout or page rendering.
export async function sendCapiEvent(e: CapiEvent): Promise<void> {
  if (!DATASET || !TOKEN) return;

  const user_data: Record<string, unknown> = {};
  const em = hash(e.userData.email);
  if (em) user_data.em = [em];
  if (e.userData.fbp) user_data.fbp = e.userData.fbp;
  if (e.userData.fbc) user_data.fbc = e.userData.fbc;
  if (e.userData.clientIp) user_data.client_ip_address = e.userData.clientIp;
  if (e.userData.userAgent) user_data.client_user_agent = e.userData.userAgent;

  const payload = {
    data: [
      {
        event_name: e.eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_id: e.eventId,
        event_source_url: e.eventSourceUrl,
        action_source: e.actionSource ?? "website",
        user_data,
        custom_data: e.customData,
      },
    ],
  };

  try {
    await fetch(`${GRAPH}/${DATASET}/events?access_token=${TOKEN}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    /* swallow — never break the request over tracking */
  }
}
