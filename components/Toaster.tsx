"use client";
import { useToast } from "@/lib/toastStore";

export function Toaster() {
  const toasts = useToast((s) => s.toasts);
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] flex flex-col items-center gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="rounded-full px-5 py-2 text-sm font-medium text-black border-2 border-black shadow-lg animate-[toastIn_0.18s_ease-out]"
          style={{ background: "var(--accent)" }}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
