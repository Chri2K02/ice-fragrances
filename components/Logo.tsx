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
    <Image src={src} alt="Ice Fragrances" width={180} height={60} priority />
  );
}
