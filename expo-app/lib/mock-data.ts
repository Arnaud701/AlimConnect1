import { supabase } from './supabase';

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
  type: 'supermarché' | 'supérette' | 'boulangerie' | 'épicerie';
  address: string;
  distance: string;
  rating: number;
  reviewCount: number;
  image: string;
  lat: number;
  lng: number;
}

// Données statiques de démo (fallback si Supabase vide)
export const sellers: Seller[] = [
  {
    id: '1',
    name: 'Carrefour City Belleville',
    type: 'supermarché',
    address: '42 Rue de Belleville, 75020 Paris',
    distance: '0.3 km',
    rating: 4.6,
    reviewCount: 128,
    image: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=400&h=300&fit=crop',
    lat: 48.8722,
    lng: 2.3832,
  },
  {
    id: '2',
    name: 'Bio & Frais',
    type: 'épicerie',
    address: '15 Avenue Gambetta, 75020 Paris',
    distance: '0.7 km',
    rating: 4.8,
    reviewCount: 89,
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&h=300&fit=crop',
    lat: 48.865,
    lng: 2.398,
  },
  {
    id: '3',
    name: 'Franprix République',
    type: 'supérette',
    address: '8 Place de la République, 75011 Paris',
    distance: '1.2 km',
    rating: 4.3,
    reviewCount: 215,
    image: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=400&h=300&fit=crop',
    lat: 48.8676,
    lng: 2.364,
  },
  {
    id: '4',
    name: 'La Boulangerie du Coin',
    type: 'boulangerie',
    address: '23 Rue Oberkampf, 75011 Paris',
    distance: '0.9 km',
    rating: 4.9,
    reviewCount: 342,
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=300&fit=crop',
    lat: 48.8648,
    lng: 2.3785,
  },
];

export const products: Product[] = [
  {
    id: '1',
    name: 'Yaourts nature bio (x6)',
    description: 'Lot de 6 yaourts nature bio, texture onctueuse et goût authentique.',
    originalPrice: 4.2,
    reducedPrice: 1.5,
    expiryDate: '2026-06-23',
    image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&h=300&fit=crop',
    category: 'Produits laitiers',
    sellerId: '1',
    quantity: 8,
  },
  {
    id: '2',
    name: 'Baguettes tradition (x3)',
    description: 'Baguettes tradition croustillantes du jour, cuites sur pierre.',
    originalPrice: 3.9,
    reducedPrice: 1.2,
    expiryDate: '2026-04-22',
    image: 'https://images.unsplash.com/photo-1549931319-a545753467c8?w=400&h=300&fit=crop',
    category: 'Boulangerie',
    sellerId: '4',
    quantity: 5,
  },
  {
    id: '3',
    name: 'Salade composée',
    description: 'Salade fraîche avec poulet grillé, tomates cerises et vinaigrette maison.',
    originalPrice: 6.5,
    reducedPrice: 2.8,
    expiryDate: '2026-04-22',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop',
    category: 'Plats préparés',
    sellerId: '2',
    quantity: 3,
  },
  {
    id: '4',
    name: 'Lot de fruits variés',
    description: 'Pommes, bananes et oranges légèrement abîmées mais parfaitement consommables.',
    originalPrice: 5.0,
    reducedPrice: 1.9,
    expiryDate: '2026-04-24',
    image: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=400&h=300&fit=crop',
    category: 'Fruits & Légumes',
    sellerId: '3',
    quantity: 12,
  },
  {
    id: '5',
    name: 'Croissants au beurre (x4)',
    description: 'Croissants pur beurre feuilletés, dorés à souhait.',
    originalPrice: 4.8,
    reducedPrice: 1.6,
    expiryDate: '2026-04-22',
    image: 'https://images.unsplash.com/photo-1555507036-ab1f4038024a?w=400&h=300&fit=crop',
    category: 'Boulangerie',
    sellerId: '4',
    quantity: 6,
  },
  {
    id: '6',
    name: 'Fromage camembert',
    description: 'Camembert de Normandie AOP, affiné au lait cru.',
    originalPrice: 3.8,
    reducedPrice: 1.4,
    expiryDate: '2026-05-25',
    image: 'https://images.unsplash.com/photo-1452195100486-9cc805987862?w=400&h=300&fit=crop',
    category: 'Produits laitiers',
    sellerId: '1',
    quantity: 4,
  },
];

// ── Supabase DB ───────────────────────────────────────────────────

function mapRow(row: Record<string, unknown>): Product {
  return {
    id: row.id as string,
    name: row.name as string,
    description: (row.description as string) ?? '',
    originalPrice: Number(row.original_price),
    reducedPrice: Number(row.reduced_price),
    expiryDate: row.expiry_date as string,
    image: (row.image_url as string) ?? '',
    category: (row.category as string) ?? '',
    sellerId: row.seller_id as string,
    quantity: Number(row.quantity),
  };
}

export async function fetchProductsFromDB(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });
  if (error || !data) return [];
  return data.map(mapRow);
}

export async function fetchProductsBySellerFromDB(sellerId: string): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('seller_id', sellerId)
    .order('created_at', { ascending: false });
  if (error || !data) return [];
  return data.map(mapRow);
}

export async function uploadProductImage(uri: string, sellerId: string): Promise<string> {
  const filename = `${sellerId}/${Date.now()}.jpg`;

  const response = await fetch(uri);
  const blob = await response.blob();

  const { error } = await supabase.storage
    .from('product-images')
    .upload(filename, blob, { contentType: 'image/jpeg', upsert: false });

  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from('product-images').getPublicUrl(filename);
  return data.publicUrl;
}

export async function insertProductToDB(product: Omit<Product, 'id'>): Promise<Product> {
  const { data, error } = await supabase
    .from('products')
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
  return mapRow(data as Record<string, unknown>);
}

export async function deleteProductFromDB(productId: string): Promise<void> {
  const { error } = await supabase.from('products').delete().eq('id', productId);
  if (error) throw new Error(error.message);
}

export async function getAllProducts(): Promise<Product[]> {
  const dbProducts = await fetchProductsFromDB();
  if (dbProducts.length > 0) return dbProducts;
  return products; // fallback sur les données statiques si la DB est vide
}

// Helpers inchangés
export function getDaysUntilExpiry(expiryDate: string): number {
  const now = new Date();
  const expiry = new Date(expiryDate);
  const diff = expiry.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function getExpiryLabel(days: number): { text: string; urgent: boolean } {
  if (days <= 0) return { text: 'Expiré', urgent: true };
  if (days === 1) return { text: 'Expire demain', urgent: true };
  if (days <= 3) return { text: `${days} jours restants`, urgent: true };
  return { text: `${days} jours restants`, urgent: false };
}

export function getDiscountPercentage(original: number, reduced: number): number {
  return Math.round(((original - reduced) / original) * 100);
}
