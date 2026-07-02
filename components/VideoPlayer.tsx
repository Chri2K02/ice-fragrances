"use client";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

type Props = {
  src: string;
  poster: string;
  label: string;
  onReady?: () => void;
  // Per-video audio, configured admin-side. `startMuted` is muted-by-default;
  // `volume` is 0-100. Viewers can still toggle mute.
  startMuted?: boolean;
  volume?: number;
};

export function VideoPlayer({
  src,
  poster,
  label,
  onReady,
  startMuted = true,
  volume = 100,
}: Props) {
  const ref = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(startMuted);

  // Keep the DOM element's muted property in sync BEFORE paint, so the browser
  // sees a muted element and does not block autoplay (React's `muted` attribute
  // alone is unreliable).
  useLayoutEffect(() => {
    if (ref.current) ref.current.muted = muted;
  }, [muted]);

  // Apply the admin-configured volume (0-100 -> 0-1).
  useLayoutEffect(() => {
    if (ref.current) {
      ref.current.volume = Math.min(1, Math.max(0, volume / 100));
    }
  }, [volume]);

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
    <div className="relative w-full h-full">
      <video
        ref={ref}
        data-testid="video"
        src={src}
        poster={poster}
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        // Fires once the first frame is decoded; the carousel uses this to begin
        // auto-advancing only after the video is actually ready to show.
        onLoadedData={onReady}
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
