import { supabase } from "./supabase";

export interface Product {
  id: string;
  name: string;
  description: string;
  originalPrice: number;
  reducedPrice: number;
  expiryDate: string;
  image: string;
  category: string;
  sellerId: string;
  quantity: number;
}

export interface Seller {
  id: string;
  name: string;
  type: "supermarché" | "supérette" | "boulangerie" | "épicerie";
  address: string;
  distance: string;
  rating: number;
  reviewCount: number;
  image: string;
  lat: number;
  lng: number;
}

export const sellers: Seller[] = [
  {
    id: "1",
    name: "Carrefour City Belleville",
    type: "supermarché",
    address: "42 Rue de Belleville, 75020 Paris",
    distance: "0.3 km",
    rating: 4.6,
    reviewCount: 128,
    image: "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=400&h=300&fit=crop",
    lat: 48.8722,
    lng: 2.3832,
  },
  {
    id: "2",
    name: "Bio & Frais",
    type: "épicerie",
    address: "15 Avenue Gambetta, 75020 Paris",
    distance: "0.7 km",
    rating: 4.8,
    reviewCount: 89,
    image: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&h=300&fit=crop",
    lat: 48.865,
    lng: 2.398,
  },
  {
    id: "3",
    name: "Franprix République",
    type: "supérette",
    address: "8 Place de la République, 75011 Paris",
    distance: "1.2 km",
    rating: 4.3,
    reviewCount: 215,
    image: "https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=400&h=300&fit=crop",
    lat: 48.8676,
    lng: 2.364,
  },
  {
    id: "4",
    name: "La Boulangerie du Coin",
    type: "boulangerie",
    address: "23 Rue Oberkampf, 75011 Paris",
    distance: "0.9 km",
    rating: 4.9,
    reviewCount: 342,
    image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=300&fit=crop",
    lat: 48.8648,
    lng: 2.3785,
  },
];

export const products: Product[] = [
  {
    id: "1",
    name: "Yaourts nature bio (x6)",
    description: "Lot de 6 yaourts nature bio, texture onctueuse et goût authentique.",
    originalPrice: 4.2,
    reducedPrice: 1.5,
    expiryDate: "2026-06-23",
    image: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&h=300&fit=crop",
    category: "Produits laitiers",
    sellerId: "1",
    quantity: 8,
  },
  {
    id: "2",
    name: "Baguettes tradition (x3)",
    description: "Baguettes tradition croustillantes du jour, cuites sur pierre.",
    originalPrice: 3.9,
    reducedPrice: 1.2,
    expiryDate: "2026-04-22",
    image: "https://images.unsplash.com/photo-1549931319-a545753467c8?w=400&h=300&fit=crop",
    category: "Boulangerie",
    sellerId: "4",
    quantity: 5,
  },
  {
    id: "3",
    name: "Salade composée",
    description: "Salade fraîche avec poulet grillé, tomates cerises et vinaigrette maison.",
    originalPrice: 6.5,
    reducedPrice: 2.8,
    expiryDate: "2026-04-22",
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop",
    category: "Plats préparés",
    sellerId: "2",
    quantity: 3,
  },
  {
    id: "4",
    name: "Lot de fruits variés",
    description: "Pommes, bananes et oranges légèrement abîmées mais parfaitement consommables.",
    originalPrice: 5.0,
    reducedPrice: 1.9,
    expiryDate: "2026-04-24",
    image: "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=400&h=300&fit=crop",
    category: "Fruits & Légumes",
    sellerId: "3",
    quantity: 12,
  },
  {
    id: "5",
    name: "Croissants au beurre (x4)",
    description: "Croissants pur beurre feuilletés, dorés à souhait.",
    originalPrice: 4.8,
    reducedPrice: 1.6,
    expiryDate: "2026-04-22",
    image: "https://images.unsplash.com/photo-1555507036-ab1f4038024a?w=400&h=300&fit=crop",
    category: "Boulangerie",
    sellerId: "4",
    quantity: 6,
  },
  {
    id: "6",
    name: "Fromage camembert",
    description: "Camembert de Normandie AOP, affiné au lait cru.",
    originalPrice: 3.8,
    reducedPrice: 1.4,
    expiryDate: "2026-05-25",
    image: "https://images.unsplash.com/photo-1452195100486-9cc805987862?w=400&h=300&fit=crop",
    category: "Produits laitiers",
    sellerId: "1",
    quantity: 4,
  },
];

export interface SellerProfile {
  id: string;
  name: string;
  type: string;
  address: string;
  lat: number;
  lng: number;
  rating: number;
  reviewCount: number;
  image: string;
  distance?: string;
}

// ── Supabase DB ───────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRow(row: any): Product {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? "",
    originalPrice: Number(row.original_price),
    reducedPrice: Number(row.reduced_price),
    expiryDate: row.expiry_date,
    image: row.image_url ?? "",
    category: row.category ?? "",
    sellerId: row.seller_id,
    quantity: Number(row.quantity),
  };
}

export async function fetchProductsFromDB(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map(mapRow);
}

export async function fetchProductsBySellerFromDB(sellerId: string): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("seller_id", sellerId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map(mapRow);
}

export async function uploadProductImageWeb(file: File, sellerId: string): Promise<string> {
  const filename = `${sellerId}/${Date.now()}-${file.name}`;
  const { error } = await supabase.storage
    .from("product-images")
    .upload(filename, file, { contentType: file.type, upsert: false });
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from("product-images").getPublicUrl(filename);
  return data.publicUrl;
}

export async function insertProductToDB(product: Omit<Product, "id">): Promise<Product> {
  const { data, error } = await supabase
    .from("products")
    .insert({
      seller_id: product.sellerId,
      name: product.name,
      description: product.description,
      original_price: product.originalPrice,
      reduced_price: product.reducedPrice,
      expiry_date: product.expiryDate,
      image_url: product.image,
      category: product.category,
      quantity: product.quantity,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return mapRow(data);
}

export async function updateProductInDB(productId: string, product: Partial<Omit<Product, "id">>): Promise<Product> {
  const { data, error } = await supabase
    .from("products")
    .update({
      ...(product.name !== undefined && { name: product.name }),
      ...(product.description !== undefined && { description: product.description }),
      ...(product.category !== undefined && { category: product.category }),
      ...(product.originalPrice !== undefined && { original_price: product.originalPrice }),
      ...(product.reducedPrice !== undefined && { reduced_price: product.reducedPrice }),
      ...(product.expiryDate !== undefined && { expiry_date: product.expiryDate }),
      ...(product.image !== undefined && { image_url: product.image }),
      ...(product.quantity !== undefined && { quantity: product.quantity }),
    })
    .eq("id", productId)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return mapRow(data);
}

export async function deleteProductFromDB(productId: string): Promise<void> {
  const { error } = await supabase.from("products").delete().eq("id", productId);
  if (error) throw new Error(error.message);
}

export async function getAllProducts(): Promise<Product[]> {
  const dbProducts = await fetchProductsFromDB();
  if (dbProducts.length > 0) return dbProducts;
  return products;
}

// ── Haversine distance (km) ────────────────────────────────────────
export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function upsertSellerProfile(
  userId: string,
  data: { name: string; type: string; address: string; lat: number; lng: number; imageUrl: string; paymentMethod?: string; paymentNumber?: string },
): Promise<void> {
  const { error } = await supabase.from("sellers").upsert({
    id: userId,
    name: data.name,
    type: data.type,
    address: data.address,
    lat: data.lat,
    lng: data.lng,
    image_url: data.imageUrl,
    ...(data.paymentMethod && { payment_method: data.paymentMethod }),
    ...(data.paymentNumber && { payment_number: data.paymentNumber }),
  }, { onConflict: "id" });
  if (error) throw new Error(error.message);
}

export async function getSellerProfile(userId: string): Promise<SellerProfile | null> {
  const { data } = await supabase.from("sellers").select("*").eq("id", userId).single();
  if (!data) return null;
  return { id: data.id, name: data.name, type: data.type, address: data.address, lat: data.lat, lng: data.lng, rating: data.rating ?? 0, reviewCount: data.review_count ?? 0, image: data.image_url ?? "" };
}

export async function fetchAllSellersFromDB(): Promise<SellerProfile[]> {
  const { data } = await supabase.from("sellers").select("*, ratings(rating)");
  if (!data) return [];
  return data.map((s) => {
    const ratings = (s.ratings ?? []) as { rating: number }[];
    const avgRating = ratings.length > 0 ? Math.round((ratings.reduce((a: number, r: { rating: number }) => a + r.rating, 0) / ratings.length) * 10) / 10 : 0;
    return { id: s.id, name: s.name, type: s.type, address: s.address, lat: s.lat, lng: s.lng, rating: avgRating, reviewCount: ratings.length, image: s.image_url ?? "" };
  });
}

export async function updateClientLocation(userId: string, address: string, lat: number, lng: number): Promise<void> {
  const { error } = await supabase.from("profiles").update({ address, lat, lng }).eq("id", userId);
  if (error) throw new Error(error.message);
}

export async function getClientLocation(userId: string): Promise<{ address: string; lat: number; lng: number } | null> {
  const { data } = await supabase.from("profiles").select("address, lat, lng").eq("id", userId).single();
  if (!data?.lat) return null;
  return { address: data.address ?? "", lat: data.lat, lng: data.lng };
}

export async function saveOrdersToDB(
  clientId: string,
  items: { product: Product; quantity: number }[],
): Promise<void> {
  const rows = items.map((item) => ({
    client_id: clientId,
    seller_id: item.product.sellerId,
    product_id: item.product.id,
    product_name: item.product.name,
    quantity: item.quantity,
    unit_price: item.product.reducedPrice,
    total_amount: item.product.reducedPrice * item.quantity,
  }));
  const { error } = await supabase.from("orders").insert(rows);
  if (error) throw new Error(error.message);

  // Notifications par vendeur
  const bySellerMap = new Map<string, { product: Product; quantity: number }[]>();
  items.forEach((item) => {
    const list = bySellerMap.get(item.product.sellerId) ?? [];
    list.push(item);
    bySellerMap.set(item.product.sellerId, list);
  });

  await Promise.all(
    Array.from(bySellerMap.entries()).map(([sellerId, sellerItems]) => {
      const lines = sellerItems
        .map((i) => `• ${i.product.name} ×${i.quantity} — ${i.product.reducedPrice * i.quantity} F CFA`)
        .join("\n");
      const total = sellerItems.reduce((s, i) => s + i.product.reducedPrice * i.quantity, 0);
      const sellerAmount = Math.round(total * 0.95);
      return createSellerNotification(
        sellerId,
        "Nouvelle vente !",
        `Vous avez une nouvelle commande :\n${lines}\n\nMontant net (95%) : ${sellerAmount} F CFA\nLe paiement sera effectué dans votre compte dans les heures qui suivent.`,
      );
    }),
  );
}

export interface SellerNotification {
  id: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}

export async function createSellerNotification(sellerId: string, title: string, body: string): Promise<void> {
  await supabase.from("notifications").insert({ seller_id: sellerId, title, body });
}

export async function fetchSellerNotifications(sellerId: string): Promise<SellerNotification[]> {
  const { data } = await supabase
    .from("notifications")
    .select("*")
    .eq("seller_id", sellerId)
    .order("created_at", { ascending: false })
    .limit(30);
  return (data ?? []).map((n) => ({ id: n.id, title: n.title, body: n.body, read: n.read, createdAt: n.created_at }));
}

export async function markNotificationsRead(sellerId: string): Promise<void> {
  await supabase.from("notifications").update({ read: true }).eq("seller_id", sellerId).eq("read", false);
}

export async function getSellerStats(sellerId: string): Promise<{ sales: number; revenue: number; rating: number }> {
  const [ordersRes, ratingsRes] = await Promise.all([
    supabase.from("orders").select("quantity, total_amount").eq("seller_id", sellerId),
    supabase.from("ratings").select("rating").eq("seller_id", sellerId),
  ]);
  const sales = (ordersRes.data ?? []).reduce((s, o) => s + Number(o.quantity), 0);
  const revenue = (ordersRes.data ?? []).reduce((s, o) => s + Number(o.total_amount), 0);
  const ratings = ratingsRes.data ?? [];
  const rating = ratings.length > 0
    ? Math.round((ratings.reduce((s, r) => s + r.rating, 0) / ratings.length) * 10) / 10
    : 0;
  return { sales, revenue, rating };
}

export async function upsertRating(clientId: string, sellerId: string, rating: number): Promise<void> {
  const { error } = await supabase.from("ratings").upsert(
    { client_id: clientId, seller_id: sellerId, rating },
    { onConflict: "client_id,seller_id" },
  );
  if (error) throw new Error(error.message);
}

export interface Order {
  id: string;
  productName: string;
  sellerName: string;
  sellerId: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  createdAt: string;
}

export async function fetchClientOrders(clientId: string): Promise<Order[]> {
  const { data, error } = await supabase
    .from("orders")
    .select("*, sellers(name)")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map((o) => ({
    id: o.id,
    productName: o.product_name,
    sellerName: (o.sellers as { name: string } | null)?.name ?? "Vendeur",
    sellerId: o.seller_id,
    quantity: o.quantity,
    unitPrice: Number(o.unit_price),
    totalAmount: Number(o.total_amount),
    createdAt: o.created_at,
  }));
}

export async function getClientRatingForSeller(clientId: string, sellerId: string): Promise<number | null> {
  const { data } = await supabase.from("ratings").select("rating").eq("client_id", clientId).eq("seller_id", sellerId).single();
  return data?.rating ?? null;
}

export function getDaysUntilExpiry(expiryDate: string): number {
  const now = new Date();
  const expiry = new Date(expiryDate);
  return Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function getExpiryLabel(days: number): { text: string; urgent: boolean } {
  if (days <= 0) return { text: "Expiré", urgent: true };
  if (days === 1) return { text: "Expire demain", urgent: true };
  if (days <= 3) return { text: `${days} jours restants`, urgent: true };
  return { text: `${days} jours restants`, urgent: false };
}

export function getDiscountPercentage(original: number, reduced: number): number {
  return Math.round(((original - reduced) / original) * 100);
}
