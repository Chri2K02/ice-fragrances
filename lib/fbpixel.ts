export const FB_PIXEL_ID = process.env.NEXT_PUBLIC_FB_PIXEL_ID;

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

function getCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const m = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]+)"));
  return m ? decodeURIComponent(m[1]) : undefined;
}

export function newEventId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

// Forward the event to our first-party CAPI relay (/api/track). Same-origin, so
// ad blockers rarely block it. Paired with the browser pixel by eventId so Meta
// de-duplicates.
function relay(
  eventName: string,
  eventId: string,
  customData?: Record<string, unknown>
) {
  if (typeof window === "undefined") return;
  try {
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        eventName,
        eventId,
        eventSourceUrl: window.location.href,
        customData,
        fbp: getCookie("_fbp"),
        fbc: getCookie("_fbc"),
      }),
    }).catch(() => {});
  } catch {
    /* ignore — tracking must never break the page */
  }
}

// Fire an event on the browser pixel (with eventID for dedup) AND server-side
// via the relay, so it lands even when the browser pixel is blocked.
export function fbTrack(
  event: string,
  params?: Record<string, unknown>,
  eventId?: string
) {
  const id = eventId ?? newEventId();
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", event, params, { eventID: id });
  }
  relay(event, id, params);
}

export function fbPageView(eventId?: string) {
  const id = eventId ?? newEventId();
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", "PageView", {}, { eventID: id });
  }
  relay("PageView", id);
}
