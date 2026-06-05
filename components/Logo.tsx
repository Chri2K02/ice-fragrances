"use client";
import Image from "next/image";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { logoForTheme } from "@/lib/theme";

export function Logo() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const src = logoForTheme(mounted ? resolvedTheme : "light");
  return (
    <Image
      src={src}
      alt="Ice Fragrances"
      width={554}
      height={283}
      priority
      className="w-full max-w-sm h-auto dark:[filter:drop-shadow(0_0_1px_rgba(255,255,255,0.55))]"
    />
  );
}
