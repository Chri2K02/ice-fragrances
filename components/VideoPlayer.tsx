"use client";
import { useEffect, useRef, useState } from "react";

type Props = { src: string; poster: string; label: string };

export function VideoPlayer({ src, poster, label }: Props) {
  const ref = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);

  // Keep the DOM element's muted property in sync (attribute alone is unreliable)
  useEffect(() => {
    if (ref.current) ref.current.muted = muted;
  }, [muted]);

  // Play only while on screen
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) el.play().catch(() => {});
        else el.pause();
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div className="relative">
      <video
        ref={ref}
        data-testid="video"
        src={src}
        poster={poster}
        loop
        muted
        playsInline
        preload="metadata"
        aria-label={label}
        className="w-full h-full object-cover rounded-2xl"
      />
      <button
        type="button"
        onClick={() => setMuted((m) => !m)}
        aria-label={muted ? "Unmute video" : "Mute video"}
        className="absolute bottom-3 right-3 rounded-full bg-black/60 text-white px-3 py-1 text-sm backdrop-blur"
      >
        {muted ? "Unmute" : "Mute"}
      </button>
    </div>
  );
}
