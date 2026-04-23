import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import MobileHeader from '@/components/MobileHeader';
import { products } from '@/lib/mock-data';
import {
  clearCart,
  getCart,
  removeFromCart,
  updateCartItemQuantity,
} from '@/lib/cart';
import { getCurrentUser } from '@/lib/auth';
import { formatPriceFcfa } from '@/lib/utils';
import { useToast } from '@/context/ToastContext';

export default function CartScreen() {
  const router = useRouter();
  const { toast } = useToast();
  const [cartItems, setCartItems] = useState(() => getCart());

  useEffect(() => {
    const user = getCurrentUser();
    if (!user || user.role !== 'client') {
      router.replace('/auth/client' as any);
    }
  }, []);

  const enrichedCartItems = useMemo(() => {
    return cartItems
      .map((item) => ({ ...item, product: products.find((p) => p.id === item.productId) }))
      .filter((item) => item.product);
  }, [cartItems]);

  const totalCount = enrichedCartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = enrichedCartItems.reduce(
    (sum, item) => sum + (item.product?.reducedPrice ?? 0) * item.quantity,
    0,
  );

  const handleQuantityChange = (productId: string, quantity: number) => {
    setCartItems(updateCartItemQuantity(productId, quantity));
  };

  const handleRemove = (productId: string) => {
    setCartItems(removeFromCart(productId));
  };

  const handleCheckout = () => {
    if (totalCount === 0) {
      toast({ title: 'Panier vide', description: 'Ajoutez des produits avant de payer.', type: 'error' });
      return;
    }
    clearCart();
    setCartItems([]);
    toast({ title: 'Paiement effectué', description: 'Merci ! Votre commande est validée.', type: 'success' });
    setTimeout(() => router.replace('/marketplace'), 800);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#FCFCFC' }}>
      <MobileHeader title="Mon panier" />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <View className="bg-card rounded-2xl border border-border p-4">
          <Text className="text-lg font-semibold text-foreground mb-2">
            {`Articles (${totalCount})`}
          </Text>

          {enrichedCartItems.length === 0 ? (
            <Text className="text-sm text-muted-foreground">Votre panier est vide.</Text>
          ) : (
            <View className="gap-3">
              {enrichedCartItems.map((item) => (
                <View
                  key={item.product!.id}
                  className="bg-background border border-border rounded-xl p-3"
                >
                  <View className="flex-row items-center justify-between gap-3">
                    <View className="flex-1">
                      <Text className="font-medium text-foreground">{item.product!.name}</Text>
                      <Text className="text-xs text-muted-foreground mt-1">
                        {item.product!.category}
                      </Text>
                      <Text className="text-xs text-muted-foreground">
                        {item.quantity} × {formatPriceFcfa(item.product!.reducedPrice)}
                      </Text>
                    </View>
                    <Pressable onPress={() => handleRemove(item.productId)}>
                      <Text className="text-xs text-destructive underline">Supprimer</Text>
                    </Pressable>
                  </View>
                  <View className="flex-row items-center gap-2 mt-2">
                    <Pressable
                      onPress={() =>
                        handleQuantityChange(item.productId, Math.max(1, item.quantity - 1))
                      }
                      className="px-3 py-1 rounded bg-secondary"
                    >
                      <Text className="text-sm font-semibold text-secondary-foreground">-</Text>
                    </Pressable>
                    <Text className="text-sm font-semibold text-foreground">{item.quantity}</Text>
                    <Pressable
                      onPress={() => handleQuantityChange(item.productId, item.quantity + 1)}
                      className="px-3 py-1 rounded bg-secondary"
                    >
                      <Text className="text-sm font-semibold text-secondary-foreground">+</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          )}

          <View className="pt-4 border-t border-border mt-4">
            <Text className="text-sm text-muted-foreground mb-1">Montant total :</Text>
            <Text className="text-xl font-bold text-foreground mb-3">
              {formatPriceFcfa(totalPrice)}
            </Text>
            <Pressable
              onPress={handleCheckout}
              className="w-full rounded-xl bg-primary py-3 items-center active:opacity-90"
            >
              <Text className="text-white font-semibold">Valider le panier</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
