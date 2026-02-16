/* ------------------------------------------------------------------ */
/*  Mock data for sections that don't have real DB tables yet          */
/* ------------------------------------------------------------------ */

// --- Dashboard mocks ---

export const mockGenerationsPerDay = Array.from({ length: 30 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - 29 + i);
  return {
    date: d.toISOString().slice(0, 10),
    count: Math.floor(Math.random() * 180) + 40,
  };
});

export const mockStyleDistribution = [
  { name: "Impressionniste", value: 320 },
  { name: "Abstrait", value: 250 },
  { name: "Réaliste", value: 200 },
  { name: "Pop Art", value: 150 },
  { name: "Minimaliste", value: 130 },
  { name: "Surréaliste", value: 90 },
];

export const mockRevenueData = Array.from({ length: 30 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - 29 + i);
  return {
    date: d.toISOString().slice(0, 10),
    revenue: Math.floor(Math.random() * 500) + 100,
  };
});

// --- Artworks mocks ---

const STYLES = [
  "Impressionniste",
  "Abstrait",
  "Réaliste",
  "Pop Art",
  "Minimaliste",
  "Surréaliste",
  "Cubiste",
  "Baroque",
];

const PROMPTS = [
  "Un coucher de soleil sur l'océan",
  "Portrait futuriste d'un chat",
  "Forêt enchantée en automne",
  "Architecture brutaliste en noir et blanc",
  "Jardin japonais sous la neige",
  "Ville cyberpunk la nuit",
  "Nature morte avec des fruits",
  "Paysage lunaire abstrait",
  "Danse des aurores boréales",
  "Château médiéval en ruines",
];

export interface MockArtwork {
  id: string;
  title: string;
  prompt: string;
  creator: string;
  style: string;
  createdAt: string;
  likes: number;
  views: number;
  status: "published" | "flagged" | "hidden";
  imageUrl: string;
}

export const mockArtworks: MockArtwork[] = Array.from(
  { length: 48 },
  (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - Math.floor(Math.random() * 90));
    const style = STYLES[i % STYLES.length];
    return {
      id: `art-${String(i + 1).padStart(4, "0")}`,
      title: PROMPTS[i % PROMPTS.length].slice(0, 30),
      prompt: PROMPTS[i % PROMPTS.length],
      creator: `user_${Math.floor(Math.random() * 200)}`,
      style,
      createdAt: d.toISOString(),
      likes: Math.floor(Math.random() * 500),
      views: Math.floor(Math.random() * 2000) + 100,
      status:
        Math.random() > 0.92
          ? "flagged"
          : Math.random() > 0.95
            ? "hidden"
            : "published",
      imageUrl: `https://picsum.photos/seed/${i + 1}/400/400`,
    };
  }
);

// --- Analytics mocks ---

export const mockRetention = [
  { period: "J1", rate: 82 },
  { period: "J3", rate: 64 },
  { period: "J7", rate: 48 },
  { period: "J14", rate: 35 },
  { period: "J30", rate: 25 },
  { period: "J60", rate: 18 },
  { period: "J90", rate: 14 },
];

export const mockPopularPrompts = [
  { prompt: "Coucher de soleil sur l'océan", count: 1420 },
  { prompt: "Portrait futuriste", count: 980 },
  { prompt: "Forêt enchantée", count: 870 },
  { prompt: "Ville cyberpunk", count: 750 },
  { prompt: "Paysage montagneux", count: 620 },
];

export const mockModelUsage = [
  { model: "Stable Diffusion XL", usage: 45 },
  { model: "DALL-E 3", usage: 30 },
  { model: "Midjourney v6", usage: 15 },
  { model: "Custom Fine-tuned", usage: 10 },
];

export const mockHourlyActivity = Array.from({ length: 24 }, (_, h) => ({
  hour: `${String(h).padStart(2, "0")}h`,
  generations: Math.floor(
    Math.sin((h - 6) * (Math.PI / 12)) * 80 + 100 + Math.random() * 30
  ),
}));

export const mockRevenueByProduct = [
  { product: "Premium mensuel", revenue: 12400 },
  { product: "Premium annuel", revenue: 8200 },
  { product: "Crédits pack 50", revenue: 4300 },
  { product: "Crédits pack 100", revenue: 3100 },
  { product: "Impression HD", revenue: 1800 },
];
