import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

// Branded 1200×630 social card: dark brand surface, the light logo, and the
// tagline in the logo's sky-blue accent (#34b6f5 from globals.css), set in the
// store's display face (Glacial Indifference Bold). Statically generated at
// build time. twitter-image.tsx re-exports this so both cards stay in sync.
export const alt = "Ice Fragrances — Premium Cold-Weather Colognes";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const [logoBase64, glacialBold] = await Promise.all([
    readFile(join(process.cwd(), "public/logo-light.png"), "base64"),
    readFile(join(process.cwd(), "app/fonts/GlacialIndifference-Bold.otf")),
  ]);
  const logoSrc = `data:image/png;base64,${logoBase64}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 56,
          background:
            "radial-gradient(circle at 50% 35%, #11212b 0%, #060606 72%)",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoSrc} width={620} height={317} alt="" />
        <div
          style={{
            fontFamily: "Glacial",
            fontSize: 44,
            letterSpacing: 3,
            color: "#34b6f5",
            textTransform: "uppercase",
          }}
        >
          Premium Cold-Weather Colognes
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Glacial", data: glacialBold, style: "normal", weight: 700 },
      ],
    }
  );
}
