import React, { useEffect, useState } from 'react';
import { View, Text, Image, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Plus, Clock, Trash2, LogOut } from 'lucide-react-native';
import MobileHeader from '@/components/MobileHeader';
import { fetchProductsBySellerFromDB, deleteProductFromDB, getDaysUntilExpiry, getExpiryLabel, getDiscountPercentage, Product } from '@/lib/mock-data';
import { clearSession, getCurrentUser } from '@/lib/auth';
import { formatPriceFcfa } from '@/lib/utils';

const stats = [
  { label: 'Ventes', value: 47 },
  { label: 'Économies', value: '184€' },
  { label: 'Note', value: '4.7' },
];

export default function SellerDashboardScreen() {
  const router = useRouter();
  const [myProducts, setMyProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user || user.role !== 'seller') {
      router.replace('/auth/seller' as any);
      return;
    }
    fetchProductsBySellerFromDB(user.id).then((p) => {
      setMyProducts(p);
      setLoadingProducts(false);
    });
  }, []);

  const onLogout = async () => {
    await clearSession();
    router.replace('/auth/seller' as any);
  };

  const onDelete = async (productId: string) => {
    try {
      await deleteProductFromDB(productId);
      setMyProducts((prev) => prev.filter((p) => p.id !== productId));
    } catch {
      // silently fail
    }
  };

  const rightAction = (
    <View className="flex-row items-center gap-2">
      <Pressable onPress={onLogout} className="flex-row items-center gap-1">
        <LogOut size={16} color="#677E73" />
        <Text className="text-xs text-muted-foreground">Déco.</Text>
      </Pressable>
      <Pressable
        onPress={() => router.push('/seller/add')}
        className="w-9 h-9 rounded-xl bg-primary items-center justify-center active:opacity-80"
      >
        <Plus size={20} color="#FFFFFF" />
      </Pressable>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#FCFCFC' }}>
      <MobileHeader title="Mes produits" rightAction={rightAction} />

      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        {/* Stats row */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-4 px-4">
          <View className="flex-row gap-3">
            <View className="bg-card rounded-2xl border border-border p-4 min-w-24">
              <Text className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Actifs
              </Text>
              <Text className="text-xl font-bold text-foreground mt-1">{myProducts.length}</Text>
            </View>
            {stats.map((stat, i) => (
              <View key={i} className="bg-card rounded-2xl border border-border p-4 min-w-24">
                <Text className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  {stat.label}
                </Text>
                <Text className="text-xl font-bold text-foreground mt-1">{stat.value}</Text>
              </View>
            ))}
          </View>
        </ScrollView>

        <Text className="text-xs text-muted-foreground">
          {myProducts.length} produit{myProducts.length > 1 ? 's' : ''} en ligne
        </Text>

        {/* Products */}
        {loadingProducts ? (
          <View className="py-12 items-center">
            <ActivityIndicator size="large" color="#1F5134" />
          </View>
        ) : myProducts.length === 0 ? (
          <View className="items-center py-12 gap-3">
            <Text className="text-muted-foreground text-sm">Aucun produit en ligne.</Text>
            <Pressable
              onPress={() => router.push('/seller/add')}
              className="px-5 py-3 bg-primary rounded-xl active:opacity-80"
            >
              <Text className="text-white text-sm font-semibold">Ajouter un produit</Text>
            </Pressable>
          </View>
        ) : (
          <View className="gap-3">
            {myProducts.map((product) => {
              const days = getDaysUntilExpiry(product.expiryDate);
              const expiry = getExpiryLabel(days);
              const discount = getDiscountPercentage(product.originalPrice, product.reducedPrice);

              return (
                <View
                  key={product.id}
                  className="bg-card rounded-2xl border border-border p-3 flex-row gap-3"
                >
                  <Image
                    source={{ uri: product.image }}
                    className="w-20 h-20 rounded-xl"
                    resizeMode="cover"
                  />
                  <View className="flex-1">
                    <View className="flex-row items-start justify-between">
                      <View className="flex-1 mr-2">
                        <Text
                          className="font-semibold text-foreground text-sm"
                          numberOfLines={1}
                        >
                          {product.name}
                        </Text>
                        <Text className="text-[10px] text-muted-foreground">
                          {product.category}
                        </Text>
                      </View>
                      <Pressable onPress={() => onDelete(product.id)} className="p-1.5 rounded-lg">
                        <Trash2 size={16} color="#677E73" />
                      </Pressable>
                    </View>

                    <View className="flex-row items-center gap-2 mt-2 flex-wrap">
                      <Text className="text-sm font-bold text-primary">
                        {formatPriceFcfa(product.reducedPrice)}
                      </Text>
                      <Text className="text-[10px] text-muted-foreground line-through">
                        {formatPriceFcfa(product.originalPrice)}
                      </Text>
                      <View className="bg-accent px-1.5 py-0.5 rounded-full">
                        <Text className="text-[10px] font-semibold text-accent-foreground">
                          -{discount}%
                        </Text>
                      </View>
                    </View>

                    <View className="flex-row items-center gap-2 mt-1.5">
                      <View
                        className={`flex-row items-center gap-1 px-2 py-0.5 rounded-full ${
                          expiry.urgent ? 'bg-destructive/10' : 'bg-muted'
                        }`}
                      >
                        <Clock size={10} color={expiry.urgent ? '#DC2828' : '#677E73'} />
                        <Text
                          className={`text-[10px] font-medium ${
                            expiry.urgent ? 'text-destructive' : 'text-muted-foreground'
                          }`}
                        >
                          {expiry.text}
                        </Text>
                      </View>
                      <Text className="text-[10px] text-muted-foreground">
                        Qté: {product.quantity}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
