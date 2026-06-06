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
  freeShipping?: boolean; // true = always free shipping (colognes)
};

export const PRODUCTS: Product[] = [
  {
    id: "frost-mind",
    name: "Frost",
    priceCents: 10800,
    freeShipping: true,
    video: "/media/frost-mind.mp4",
    poster: "/media/frost-mind.jpg",
    images: [
      "/media/frost-mind.jpg",
      "/media/frost-1.jpg",
      "/media/frost-2.jpg",
      "/media/frost-3.jpg",
    ],
    tagline: 'Takes you to a "different state of mind" (Kid Bloom)',
    notes:
      "Showcases vanilla, amber, pink pepper, nutmeg, red rose and white rose with supreme elegance",
    oil: "18%",
  },
  {
    id: "glacier-hours",
    name: "Glacier",
    priceCents: 10800,
    freeShipping: true,
    video: "/media/glacier-hours.mp4",
    poster: "/media/glacier-hours.jpg",
    images: [
      "/media/glacier-hours.jpg",
      "/media/glacier-1.jpg",
      "/media/glacier-2.jpg",
      "/media/glacier-3.jpg",
      "/media/glacier-4.jpg",
    ],
    tagline: 'Feels like "insomnia relief" during "after hours" (The Weeknd)',
    notes:
      "Features grapefruit, elderwood, cedarwood, neroli, lavender and blood orange in an infinitely timeless manner",
    oil: "18%",
  },
  {
    id: "hailstone-wildflower",
    name: "Hailstone",
    priceCents: 10800,
    freeShipping: true,
    video: "/media/hailstone-wildflower.mp4",
    poster: "/media/hailstone-wildflower.jpg",
    images: [
      "/media/hailstone-wildflower.jpg",
      "/media/hailstone-1.jpg",
      "/media/hailstone-2.jpg",
      "/media/hailstone-3.jpg",
    ],
    tagline: 'Smells like an absolute "wildflower" (Beach House)',
    notes:
      "Hallmarks jasmine, coriander, incense, cloves, tonka bean, red rose and clementine with a spice to the scent overall",
    oil: "13%",
  },
  {
    id: "iceberg-embrace",
    name: "Iceberg",
    priceCents: 10800,
    freeShipping: true,
    video: "/media/iceberg-embrace.mp4",
    poster: "/media/iceberg-embrace.jpg",
    images: [
      "/media/iceberg-embrace.jpg",
      "/media/iceberg-1.jpg",
      "/media/iceberg-2.jpg",
      "/media/iceberg-3.jpg",
      "/media/iceberg-4.jpg",
      "/media/iceberg-5.jpg",
    ],
    tagline: 'Makes the world "embrace" (Pastel Ghost)',
    notes:
      "Highlights bergamot, eucalyptus, mint, pomelo, rosemary and eucalyptus boldly without being overpowering",
    oil: "13%",
  },
  {
    id: "tshirt",
    name: "Half-Sleeve Tees",
    priceCents: 3800,
    poster: "/media/tshirt-5.jpg",
    images: [
      "/media/tshirt-5.jpg",
      "/media/tshirt-1.jpg",
      "/media/tshirt-2.jpg",
      "/media/tshirt-3.jpg",
      "/media/tshirt-4.jpg",
    ],
  },
  {
    id: "dress-shirt",
    name: "Nylon Dress Shirts",
    priceCents: 6800,
    poster: "/media/dress-shirt-2.jpg",
    images: ["/media/dress-shirt-2.jpg", "/media/dress-shirt-1.jpg"],
  },
  {
    id: "humidifier",
    name: "Humidifier",
    priceCents: 3800,
    video: "/media/humidifier.mp4",
    poster: "/media/humidifier.jpg",
    images: [
      "/media/humidifier.jpg",
      "/media/humidifier-1.jpg",
      "/media/humidifier-2.jpg",
    ],
    tagline: "Freshen your world",
    notes: "A water & oil based scented humidifier. Order comes with an oil base.",
  },
  {
    id: "air-freshener",
    name: "Car Freshener's",
    priceCents: 3800,
    poster: "/media/air-freshener-2.jpg",
    images: ["/media/air-freshener-2.jpg", "/media/air-freshener.jpg"],
    tagline: "Light, tangy and cleanses the car in a spring fresh manner",
    notes: "70 fresheners each order",
  },
];

export function getProduct(id: string): Product | undefined {
  return PRODUCTS.find((p) => p.id === id);
}
