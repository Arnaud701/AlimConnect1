import { storageGet, storageSet, storageRemove, CART_KEY } from './storage';
import { Product } from './mock-data';

export interface CartItem {
  productId: string;
  quantity: number;
}

const readCart = (): CartItem[] => {
  try {
    const raw = storageGet(CART_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as CartItem[];
  } catch {
    return [];
  }
};

const writeCart = (cart: CartItem[]) => {
  storageSet(CART_KEY, JSON.stringify(cart));
};

export const getCart = (): CartItem[] => readCart();

export const getCartItemCount = (): number =>
  readCart().reduce((sum, item) => sum + item.quantity, 0);

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
    item.productId === productId ? { ...item, quantity: Math.max(1, quantity) } : item,
  );
  writeCart(cart);
  return cart;
};

export const clearCart = (): void => {
  storageRemove(CART_KEY);
};
