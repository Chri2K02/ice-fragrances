"use client";
import { useEffect } from "react";
import { fbTrack } from "@/lib/fbpixel";

export function PurchaseTracker({
  value,
  currency,
}: {
  value: number;
  currency: string;
}) {
  useEffect(() => {
    fbTrack("Purchase", { value, currency });
  }, [value, currency]);
  return null;
}
