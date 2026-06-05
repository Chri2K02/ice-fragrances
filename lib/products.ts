export type Product = {
  id: string;
  name: string;
  priceCents: number; // server-trusted price
  poster: string; // primary still / first image
  video?: string; // cologne video (optional)
  images?: string[]; // photo gallery, e.g. apparel
  tagline?: string; // evocative line under the title
  notes?: string; // scent notes / description
  oil?: string; // oil concentration, e.g. "18%"
};

export const PRODUCTS: Product[] = [
  {
    id: "frost-mind",
    name: "Frost",
    priceCents: 10800,
    video: "/media/frost-mind.mp4",
    poster: "/media/frost-mind.jpg",
    tagline: 'Takes you to a "different state of mind" (Kid Bloom)',
    notes:
      "Showcases vanilla, amber, pink pepper, nutmeg, red rose and white rose with supreme elegance",
    oil: "18%",
  },
  {
    id: "glacier-hours",
    name: "Glacier",
    priceCents: 10800,
    video: "/media/glacier-hours.mp4",
    poster: "/media/glacier-hours.jpg",
    tagline: 'Feels like "insomnia relief" during "after hours" (The Weeknd)',
    notes:
      "Features grapefruit, elderwood, cedarwood, neroli, lavender and blood orange in an infinitely timeless manner",
    oil: "18%",
  },
  {
    id: "hailstone-wildflower",
    name: "Hailstone",
    priceCents: 10800,
    video: "/media/hailstone-wildflower.mp4",
    poster: "/media/hailstone-wildflower.jpg",
    tagline: 'Smells like an absolute "wildflower" (Beach House)',
    notes:
      "Hallmarks jasmine, coriander, incense, cloves, tonka bean, red rose and clementine with a spice to the scent overall",
    oil: "13%",
  },
  {
    id: "iceberg-embrace",
    name: "Iceberg",
    priceCents: 10800,
    video: "/media/iceberg-embrace.mp4",
    poster: "/media/iceberg-embrace.jpg",
    tagline: 'Makes the world "embrace" (Pastel Ghost)',
    notes:
      "Highlights bergamot, eucalyptus, mint, pomelo, rosemary and eucalyptus boldly without being overpowering",
    oil: "13%",
  },
  {
    id: "tshirt",
    name: "T-Shirt",
    priceCents: 3800,
    poster: "/media/tshirt-1.jpg",
    images: [
      "/media/tshirt-1.jpg",
      "/media/tshirt-2.jpg",
      "/media/tshirt-3.jpg",
      "/media/tshirt-4.jpg",
      "/media/tshirt-5.jpg",
    ],
  },
  {
    id: "dress-shirt",
    name: "Dress Shirt",
    priceCents: 6800,
    poster: "/media/dress-shirt-1.jpg",
    images: ["/media/dress-shirt-1.jpg", "/media/dress-shirt-2.jpg"],
  },
  {
    id: "humidifier",
    name: "Humidifier",
    priceCents: 3800,
    video: "/media/humidifier.mp4",
    poster: "/media/humidifier.jpg",
    tagline: "Freshen your world",
    notes: "A water & oil based scented humidifier",
  },
];

export function getProduct(id: string): Product | undefined {
  return PRODUCTS.find((p) => p.id === id);
}
