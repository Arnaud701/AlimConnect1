import { Product } from "@/lib/mock-data";

export interface CartItem {
  productId: string;
  quantity: number;
}

const CART_KEY = "alimconnect-cart";

const readCart = (): CartItem[] => {
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as CartItem[];
  } catch {
    return [];
  }
};

const writeCart = (cart: CartItem[]) => {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
};

export const getCart = (): CartItem[] => {
  return readCart();
};

export const getCartItemCount = (): number => {
  return readCart().reduce((sum, item) => sum + item.quantity, 0);
};

export const addToCart = (product: Product): CartItem[] => {
  const cart = readCart();
  const existing = cart.find((item) => item.productId === product.id);

  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ productId: product.id, quantity: 1 });
  }

  writeCart(cart);
  return cart;
};

export const removeFromCart = (productId: string): CartItem[] => {
  const cart = readCart().filter((item) => item.productId !== productId);
  writeCart(cart);
  return cart;
};

export const updateCartItemQuantity = (productId: string, quantity: number): CartItem[] => {
  const cart = readCart().map((item) =>
    item.productId === productId
      ? { ...item, quantity: Math.max(1, quantity) }
      : item,
  );
  writeCart(cart);
  return cart;
};

export const clearCart = (): void => {
  localStorage.removeItem(CART_KEY);
};
