"use client";
import { useState } from "react";

type Variant = {
  productId: string;
  name: string;
  size: string;
  stock: number | null;
};

export function StockEditor({ variants }: { variants: Variant[] }) {
  return (
    <div className="space-y-2">
      {variants.map((v) => (
        <Row key={v.productId + "|" + v.size} v={v} />
      ))}
    </div>
  );
}

function Row({ v }: { v: Variant }) {
  const [value, setValue] = useState(v.stock === null ? "" : String(v.stock));
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle"
  );

  async function save() {
    if (value === "") return;
    setStatus("saving");
    try {
      const res = await fetch("/api/stock", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: v.productId,
          size: v.size,
          stock: Number(value),
        }),
      });
      setStatus(res.ok ? "saved" : "error");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div
      className="flex items-center gap-3 rounded-xl p-3"
      style={{ background: "var(--card)" }}
    >
      <span className="flex-1">
        {v.name}
        {v.size ? ` — ${v.size}` : ""}
      </span>
      <input
        type="number"
        min={0}
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setStatus("idle");
        }}
        placeholder="—"
        className="w-20 rounded-lg border border-black/15 dark:border-white/20 bg-transparent px-2 py-1 text-sm"
      />
      <button
        type="button"
        onClick={save}
        disabled={status === "saving"}
        className="rounded-full px-3 py-1 text-sm font-medium text-black border-2 border-black disabled:opacity-40"
        style={{ background: "var(--accent)" }}
      >
        {status === "saving" ? "…" : status === "saved" ? "✓ Saved" : "Save"}
      </button>
    </div>
  );
}
