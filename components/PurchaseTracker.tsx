"use client";
import { useEffect } from "react";
import { fbTrack } from "@/lib/fbpixel";

export function PurchaseTracker({
  value,
  currency,
  eventId,
}: {
  value: number;
  currency: string;
  eventId?: string;
}) {
  useEffect(() => {
    // eventId = the Stripe session id, matching the server-side Purchase the
    // webhook sends, so Meta de-duplicates the two.
    fbTrack("Purchase", { value, currency }, eventId);
  }, [value, currency, eventId]);
  return null;
}
