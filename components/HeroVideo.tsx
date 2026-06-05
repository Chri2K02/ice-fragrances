import { VideoPlayer } from "@/components/VideoPlayer";
import { glacial } from "@/lib/fonts";

export function HeroVideo() {
  return (
    <section className="relative">
      <div className="max-w-6xl mx-auto px-4 pt-8">
        <div className="mx-auto w-full max-w-sm aspect-[9/16] overflow-hidden rounded-3xl">
          <VideoPlayer
            src="/media/cloudnine.mp4"
            poster="/media/cloudnine.jpg"
            label="Ice Fragrances"
          />
        </div>
        <div className="text-center mt-8 mx-auto max-w-sm">
          <h1
            className={`${glacial.className} uppercase text-4xl sm:text-5xl font-semibold tracking-tight`}
          >
            Reinvent Yourself
          </h1>
          <a
            href="#products"
            className={`${glacial.className} inline-block mt-5 rounded-full px-6 py-3 font-bold text-black border-2 border-black`}
            style={{ background: "var(--accent)" }}
          >
            Shop
          </a>
        </div>
      </div>
    </section>
  );
}
