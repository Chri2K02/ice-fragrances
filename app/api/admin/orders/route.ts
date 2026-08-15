import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/session";
import { getDb } from "@/lib/db";
import { orders, ORDER_STATUSES, type OrderStatus } from "@/lib/db/schema";
import { hasAdminPerm } from "@/lib/admin";

// Fulfilment edits for an order. Deliberately narrow: only the fields WE own
// (status, tracking, note) are writable — money, totals and the Stripe ids are
// never mutable from here, because Stripe is the record for the payment.
export async function PATCH(req: Request) {
  const session = await getSession();
  if (!(await hasAdminPerm(session?.user.email ?? null, "orders"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    id?: number;
    status?: string;
    trackingNumber?: string | null;
    adminNote?: string | null;
    fulfilledAt?: string | null;
  };
  if (!Number.isInteger(body.id)) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  const set: Partial<{
    status: OrderStatus;
    trackingNumber: string | null;
    adminNote: string | null;
    fulfilledAt: Date | null;
  }> = {};

  if (body.status !== undefined) {
    if (!ORDER_STATUSES.includes(body.status as OrderStatus)) {
      return NextResponse.json({ error: "Unknown status" }, { status: 400 });
    }
    set.status = body.status as OrderStatus;
  }
  if (body.trackingNumber !== undefined) {
    set.trackingNumber = body.trackingNumber?.trim() || null;
  }
  if (body.adminNote !== undefined) {
    set.adminNote = body.adminNote?.trim() || null;
  }
  if (body.fulfilledAt !== undefined) {
    set.fulfilledAt = body.fulfilledAt ? new Date(body.fulfilledAt) : null;
  }
  if (Object.keys(set).length === 0) {
    return NextResponse.json({ error: "nothing to update" }, { status: 400 });
  }

  await getDb().update(orders).set(set).where(eq(orders.id, body.id!));
  return NextResponse.json({ ok: true });
}
