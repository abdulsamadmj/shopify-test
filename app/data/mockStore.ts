export type AnalyticsPoint = {
  date: string;
  sales: number;
  profit: number;
  returns: number;
  fulfilled: number;
};

export type ProductImage = {
  id: string;
  alt: string;
  url: string;
};

export type Product = {
  id: string;
  title: string;
  status: "Active" | "Draft";
  inventory: number;
  tags: string[];
  images: ProductImage[];
};

export const analyticsSummary = [
  {
    label: "Profit",
    value: "$12,430",
    trend: "+14.8%",
    tone: "success" as const,
  },
  {
    label: "Sales",
    value: "$38,920",
    trend: "+9.2%",
    tone: "success" as const,
  },
  {
    label: "Returns",
    value: "42",
    trend: "-3.1%",
    tone: "critical" as const,
  },
  {
    label: "Fulfilled",
    value: "1,248",
    trend: "+18.4%",
    tone: "success" as const,
  },
];

export const analyticsData: AnalyticsPoint[] = [
  { date: "Mon", sales: 4200, profit: 1400, returns: 8, fulfilled: 142 },
  { date: "Tue", sales: 5200, profit: 1900, returns: 5, fulfilled: 168 },
  { date: "Wed", sales: 6100, profit: 2300, returns: 6, fulfilled: 186 },
  { date: "Thu", sales: 5600, profit: 2100, returns: 4, fulfilled: 174 },
  { date: "Fri", sales: 7200, profit: 2900, returns: 7, fulfilled: 225 },
  { date: "Sat", sales: 6800, profit: 2600, returns: 5, fulfilled: 211 },
  { date: "Sun", sales: 7820, profit: 3230, returns: 7, fulfilled: 242 },
];

export const products: Product[] = [
  {
    id: "8787253705032",
    title: "Aurora Linen Shirt",
    status: "Active",
    inventory: 18,
    tags: ["Best seller", "Featured"],
    images: [
      {
        id: "aurora-primary",
        alt: "Green linen shirt folded on a white surface",
        url: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=900&q=80",
      },
      {
        id: "aurora-detail",
        alt: "Close up of neutral linen fabric texture",
        url: "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=900&q=80",
      },
    ],
  },
  {
    id: "8787253737800",
    title: "Everyday Canvas Tote",
    status: "Active",
    inventory: 6,
    tags: ["Few stocks remaining", "Eco"],
    images: [
      {
        id: "tote-primary",
        alt: "Canvas tote bag hanging from a chair",
        url: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=900&q=80",
      },
      {
        id: "tote-lifestyle",
        alt: "Minimal accessories laid out on a table",
        url: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=900&q=80",
      },
      {
        id: "tote-detail",
        alt: "Canvas textile detail",
        url: "https://images.unsplash.com/photo-1543076447-215ad9ba6923?auto=format&fit=crop&w=900&q=80",
      },
    ],
  },
  {
    id: "8787253770568",
    title: "Studio Ceramic Mug",
    status: "Draft",
    inventory: 0,
    tags: ["Out of stock", "Coming soon"],
    images: [
      {
        id: "mug-primary",
        alt: "Handmade ceramic mug on a shelf",
        url: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=900&q=80",
      },
      {
        id: "mug-lifestyle",
        alt: "Ceramic cup next to coffee beans",
        url: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=80",
      },
    ],
  },
  {
    id: "8787253803336",
    title: "Trail Runner Jacket",
    status: "Active",
    inventory: 24,
    tags: ["New arrival", "Featured"],
    images: [
      {
        id: "jacket-primary",
        alt: "Lightweight jacket on a hanger",
        url: "https://images.unsplash.com/photo-1543076447-215ad9ba6923?auto=format&fit=crop&w=900&q=80",
      },
      {
        id: "jacket-detail",
        alt: "Outdoor jacket zipper detail",
        url: "https://images.unsplash.com/photo-1548883354-94bcfe321cbb?auto=format&fit=crop&w=900&q=80",
      },
    ],
  },
];

export const imageLibrary: ProductImage[] = [
  {
    id: "generated-lifestyle",
    alt: "Warm product lifestyle scene",
    url: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "generated-flatlay",
    alt: "Product flat lay scene",
    url: "https://images.unsplash.com/photo-1516826957135-700dedea698c?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "generated-detail",
    alt: "Close crop product detail",
    url: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=80",
  },
];
