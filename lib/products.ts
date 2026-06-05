export type Product = {
  id: string;
  name: string;
  priceCents: number; // server-trusted price
  video: string; // path under /public
  poster: string; // path under /public
  blurb: string;
};

export const PRODUCTS: Product[] = [
  {
    id: "frost-mind",
    name: "Frost Mind",
    priceCents: 10800,
    video: "/media/frost-mind.mp4",
    poster: "/media/frost-mind.jpg",
    blurb: "A crisp, clarifying cologne.",
  },
  {
    id: "glacier-hours",
    name: "Glacier Hours",
    priceCents: 10800,
    video: "/media/glacier-hours.mp4",
    poster: "/media/glacier-hours.jpg",
    blurb: "Cool, lasting, and deep.",
  },
  {
    id: "hailstone-wildflower",
    name: "Hailstone Wildflower",
    priceCents: 10800,
    video: "/media/hailstone-wildflower.mp4",
    poster: "/media/hailstone-wildflower.jpg",
    blurb: "Icy florals with a wild edge.",
  },
  {
    id: "iceberg-embrace",
    name: "Iceberg Embrace",
    priceCents: 10800,
    video: "/media/iceberg-embrace.mp4",
    poster: "/media/iceberg-embrace.jpg",
    blurb: "Bold, enveloping, unforgettable.",
  },
  {
    id: "humidifier",
    name: "Humidifier",
    priceCents: 3800,
    video: "/media/humidifier.mp4",
    poster: "/media/humidifier.jpg",
    blurb: "Keep the air cool and fresh.",
  },
];

export function getProduct(id: string): Product | undefined {
  return PRODUCTS.find((p) => p.id === id);
}
