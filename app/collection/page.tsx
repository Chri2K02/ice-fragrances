import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getCatalog } from "@/lib/catalog";
import { SITE, SITE_URL } from "@/lib/site";
import { glacial, glacialRegular } from "@/lib/fonts";
import { jsonLdString } from "@/lib/structuredData";
import { Chevron } from "@/components/Chevron";
import { Reveal } from "@/components/Reveal";

// The collection's editorial page: the story of the line — the song pairings,
// the cold-weather identity, the oil concentrations. This copy is written for
// this page alone (the product pages carry their own descriptions), which is
// what makes it a real page to search engines rather than a re-slice of the
// storefront. ISR keeps poster art in sync with the admin catalog overlay.
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "The Collection — Fragrances Tuned to Songs",
  description:
    "Four cold-weather fragrances, each tuned to a song: Frost, Glacier, Hailstone and Iceberg. 13–18% oil concentration, free shipping to the US & Canada.",
  alternates: { canonical: "/collection" },
  openGraph: {
    type: "website",
    siteName: SITE.name,
    title: `The Collection · ${SITE.name}`,
    description:
      "Four cold-weather fragrances, each tuned to a song. 13–18% oil concentration, free shipping to the US & Canada.",
    url: `${SITE_URL}/collection`,
  },
};

// Editorial copy, unique to this page. The music references restate the
// catalog's own taglines (quoted phrases are from the products' taglines).
const STORIES: {
  id: string;
  audience: string;
  music: string;
  body: string;
}[] = [
  {
    id: "frost-mind",
    audience: "For her",
    music: "Tuned to Kid Bloom",
    body: "Frost opens sweet and warm — vanilla and amber laid over a bite of pink pepper and nutmeg — then softens into a double rose: red for depth, white for air. It's built at an 18% oil concentration, the highest in the collection, so it wears close and stays long into a cold night. Frost is the collection's golden hour: the one you reach for when you want to be remembered warmly. It takes you, as the tagline goes, to a different state of mind.",
  },
  {
    id: "glacier-hours",
    audience: "For him",
    music: "Tuned to The Weeknd",
    body: "Glacier is the collection's night drive: grapefruit and blood orange up front, sharpened by neroli, then a long, quiet base of cedarwood, elderwood and lavender. At 18% oil it doesn't shout — it hums, for hours. We tuned it to the feeling of finally coming down after being up too long: insomnia relief during after hours, bottled.",
  },
  {
    id: "hailstone-wildflower",
    audience: "For her",
    music: "Tuned to Beach House",
    body: "Hailstone is the wild one. Jasmine and clementine brightened with coriander and cloves, incense drifting underneath, tonka bean and red rose rounding it off. A 13% oil concentration keeps it weightless — a spice that arrives like weather and leaves petals behind. An absolute wildflower.",
  },
  {
    id: "iceberg-embrace",
    audience: "For him",
    music: "Tuned to Pastel Ghost",
    body: "Iceberg is pure cold air: bergamot and pomelo over eucalyptus, mint and rosemary. Nothing in it is heavy; everything in it is awake. At 13% oil it sits light on skin — a bold, bright fragrance that makes the world embrace, without ever overpowering the room.",
  },
];

export default async function CollectionPage() {
  const catalog = await getCatalog();
  const byId = new Map(catalog.map((p) => [p.id, p]));
  const fragrances = STORIES.map((s) => ({
    story: s,
    product: byId.get(s.id)!,
  })).filter((x) => x.product);
  const extras = catalog.filter(
    (p) => p.category === "apparel" || p.category === "accessories"
  );

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        "@id": `${SITE_URL}/collection#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
          { "@type": "ListItem", position: 2, name: "The Collection" },
        ],
      },
      {
        "@type": "ItemList",
        "@id": `${SITE_URL}/collection#list`,
        itemListElement: fragrances.map((f, i) => ({
          "@type": "ListItem",
          position: i + 1,
          url: `${SITE_URL}/products/${f.product.id}`,
        })),
      },
    ],
  };

  return (
    <main className="max-w-3xl mx-auto px-4 py-12 md:py-16 min-h-[60vh]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdString(jsonLd) }}
      />

      <header className={`${glacial.className} uppercase mb-10 max-w-2xl`}>
        <h1 className="text-4xl font-semibold">The Collection</h1>
        <p
          className={`${glacialRegular.className} normal-case mt-5 text-base leading-relaxed opacity-90`}
        >
          Ice Fragrances makes cold-weather fragrances: four scents composed
          for winter air, each tuned to a song we couldn&apos;t stop playing
          while we made it. Every bottle is built on a high oil concentration —
          13 to 18% — so the scent holds from first spray deep into the night.
          Shipping is on us across the US and Canada.
        </p>
      </header>

      <div className="space-y-14">
        {fragrances.map(({ story, product }, i) => (
          <Reveal as="section" key={product.id} index={i}>
            <div className="flex items-start gap-5">
              <Link
                href={`/products/${product.id}`}
                className="shrink-0"
                aria-hidden
                tabIndex={-1}
              >
                <Image
                  src={product.poster}
                  alt=""
                  width={112}
                  height={112}
                  className="w-24 sm:w-28 h-auto rounded-xl object-cover"
                />
              </Link>
              <div>
                <h2
                  className={`${glacial.className} uppercase text-2xl font-semibold`}
                >
                  <Link
                    href={`/products/${product.id}`}
                    className="hover:opacity-70"
                  >
                    {product.name}
                  </Link>
                </h2>
                <p
                  className={`${glacialRegular.className} text-xs uppercase tracking-widest opacity-60 mt-1`}
                >
                  {story.audience} · {story.music}
                  {product.oil ? ` · ${product.oil} oil` : ""}
                </p>
                <p
                  className={`${glacialRegular.className} mt-3 text-base leading-relaxed opacity-90`}
                >
                  {story.body}
                </p>
                <p className="mt-3">
                  <Link
                    href={`/products/${product.id}`}
                    className={`${glacialRegular.className} text-sm underline opacity-80 hover:opacity-100 inline-flex items-center gap-1`}
                  >
                    Explore {product.name}
                    <Chevron />
                  </Link>
                </p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>

      {extras.length > 0 && (
        <section className="mt-16">
          <h2 className={`${glacial.className} uppercase text-2xl font-semibold`}>
            Beyond the bottle
          </h2>
          <p
            className={`${glacialRegular.className} mt-3 text-base leading-relaxed opacity-90`}
          >
            The collection extends past fragrance — limited apparel runs we
            might never make again, and small ways to carry the scent with you:
          </p>
          <ul
            className={`${glacialRegular.className} mt-3 space-y-1 text-base`}
          >
            {extras.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/products/${p.id}`}
                  className="underline opacity-80 hover:opacity-100"
                >
                  {p.name}
                </Link>
                {p.tagline ? (
                  <span className="opacity-60"> — {p.tagline}</span>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
