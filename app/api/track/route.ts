import { NextResponse } from "next/server";
import { sendCapiEvent } from "@/lib/capi";

// First-party relay: the browser posts events here (same origin, so ad blockers
// rarely block it), and we forward them to Meta server-side with the visitor's
// IP + user agent. Paired with the browser pixel via a shared eventId so Meta
// de-duplicates. No-op until META_CAPI_TOKEN is configured.
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      eventName?: string;
      eventId?: string;
      eventSourceUrl?: string;
      customData?: Record<string, unknown>;
      fbp?: string;
      fbc?: string;
    };
    if (!body.eventName) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || undefined;
    const ua = req.headers.get("user-agent") || undefined;
    await sendCapiEvent({
      eventName: body.eventName,
      eventId: body.eventId,
      eventSourceUrl: body.eventSourceUrl,
      userData: { fbp: body.fbp, fbc: body.fbc, clientIp: ip, userAgent: ua },
      customData: body.customData,
    });
  } catch {
    /* never error the client over tracking */
  }
  return NextResponse.json({ ok: true });
}
