export const STORE_CATEGORIES = [
  "Tas",
  "Baju & Kemeja",
  "Hoodie & Jaket",
  "Celana",
];

export const FASHION_IMAGES = {
  hero: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=1800&h=1000&q=85",
  bag: "https://images.unsplash.com/photo-1548863227-3af567fc3b27?auto=format&fit=crop&w=900&q=85",
  shirt: "https://images.unsplash.com/photo-1627686011747-74adda3d2343?auto=format&fit=crop&w=900&q=85",
  shirtLook: "https://images.unsplash.com/photo-1589810635657-232948472d98?auto=format&fit=crop&w=900&q=85",
  hoodie: "https://images.unsplash.com/photo-1738486260590-23c954cf29b8?auto=format&fit=crop&w=900&q=85",
  jacket: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=900&q=85",
  trousers: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=900&q=85",
  denim: "https://images.unsplash.com/photo-1714143164072-7646ef5cb24d?auto=format&fit=crop&w=900&q=85",
  collection: "https://images.unsplash.com/photo-1551232864-3f0890e580d9?auto=format&fit=crop&w=1600&h=800&q=85",
};

export const DEMO_PRODUCTS = [
  {
    id: "demo-canvas-tote",
    title: "Tas Tote Kanvas Sore",
    description:
      "Tas kanvas ringan untuk membawa barang esensial saat pergi kuliah, kerja, atau jalan santai.",
    category: "Tas",
    price: 179000,
    rating: { rate: 4.8, count: 24 },
    image: FASHION_IMAGES.bag,
    isDemo: true,
  },
  {
    id: "demo-cotton-shirt",
    title: "Kemeja Katun Santai",
    description:
      "Kemeja katun berpotongan santai dengan warna netral yang mudah dipadukan.",
    category: "Baju & Kemeja",
    price: 249000,
    rating: { rate: 4.7, count: 18 },
    image: FASHION_IMAGES.shirt,
    isDemo: true,
  },
  {
    id: "demo-striped-shirt",
    title: "Kemeja Garis Senja",
    description:
      "Kemeja lengan panjang bermotif garis halus untuk tampilan rapi tanpa terasa kaku.",
    category: "Baju & Kemeja",
    price: 279000,
    rating: { rate: 4.6, count: 15 },
    image: FASHION_IMAGES.shirtLook,
    isDemo: true,
  },
  {
    id: "demo-everyday-hoodie",
    title: "Hoodie Fleece Harian",
    description:
      "Hoodie fleece lembut dengan potongan relaxed, nyaman untuk dipakai saat cuaca sejuk.",
    category: "Hoodie & Jaket",
    price: 349000,
    rating: { rate: 4.9, count: 31 },
    image: FASHION_IMAGES.hoodie,
    isDemo: true,
  },
  {
    id: "demo-light-jacket",
    title: "Jaket Ringan Pagi",
    description:
      "Jaket ringan dengan siluet sederhana untuk melengkapi pakaian harian.",
    category: "Hoodie & Jaket",
    price: 399000,
    rating: { rate: 4.8, count: 20 },
    image: FASHION_IMAGES.jacket,
    isDemo: true,
  },
  {
    id: "demo-straight-trousers",
    title: "Celana Chino Straight",
    description:
      "Celana chino berpotongan lurus yang mudah dipadukan dengan kaus maupun kemeja.",
    category: "Celana",
    price: 299000,
    rating: { rate: 4.7, count: 22 },
    image: FASHION_IMAGES.trousers,
    isDemo: true,
  },
  {
    id: "demo-relaxed-denim",
    title: "Denim Relaxed Fit",
    description:
      "Celana denim dengan potongan relaxed dan warna biru klasik untuk dipakai sehari-hari.",
    category: "Celana",
    price: 329000,
    rating: { rate: 4.8, count: 27 },
    image: FASHION_IMAGES.denim,
    isDemo: true,
  },
];

export function getDemoProduct(id) {
  return DEMO_PRODUCTS.find((product) => product.id === id);
}

export function getApparelCategory(product) {
  if (
    product.category !== "men's clothing" &&
    product.category !== "women's clothing"
  ) {
    return null;
  }

  if (/\b(backpack|bag|tote)\b/i.test(product.title)) return "Tas";
  if (/\b(jacket|hoodie|coat|windbreaker)\b/i.test(product.title)) {
    return "Hoodie & Jaket";
  }

  return "Baju & Kemeja";
}

export function normalizeApiProduct(product) {
  return {
    ...product,
    category: getApparelCategory(product) || product.category,
    price: Math.round((product.price * 15000) / 1000) * 1000,
    isDemo: false,
  };
}

export function formatPrice(price) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(price);
}
