import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, ScrollView, Pressable, FlatList, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Search, LogOut, ShoppingCart } from 'lucide-react-native';
import MobileHeader from '@/components/MobileHeader';
import ProductCard from '@/components/ProductCard';
import { getAllProducts, Product } from '@/lib/mock-data';
import { addToCart, getCartItemCount } from '@/lib/cart';
import { clearSession, getCurrentUser } from '@/lib/auth';
import { useToast } from '@/context/ToastContext';

const categories = ['Tout', 'Boulangerie', 'Produits laitiers', 'Fruits & Légumes', 'Plats préparés'];

export default function MarketplaceScreen() {
  const router = useRouter();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Tout');
  const [cartCount, setCartCount] = useState(() => getCartItemCount());
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user || user.role !== 'client') {
      router.replace('/auth/client' as any);
      return;
    }
    getAllProducts().then((p) => {
      setAllProducts(p);
      setLoadingProducts(false);
    });
  }, []);

  const onLogout = async () => {
    await clearSession();
    router.replace('/auth/client' as any);
  };

  const onAddToCart = (product: Product) => {
    addToCart(product);
    const count = getCartItemCount();
    setCartCount(count);
    toast({
      title: 'Produit ajouté',
      description: `${product.name} ajouté au panier (${count} articles).`,
      type: 'success',
    });
  };

  const filtered = allProducts.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCategory = category === 'Tout' || p.category === category;
    return matchSearch && matchCategory;
  });

  const cartButton = (
    <View className="flex-row items-center gap-2">
      <Pressable onPress={() => router.push('/cart')} className="relative">
        <View className="w-9 h-9 rounded-xl bg-primary items-center justify-center">
          <ShoppingCart size={16} color="#FFFFFF" />
        </View>
        {cartCount > 0 && (
          <View className="absolute -top-1 -right-1 h-5 min-w-5 px-1 rounded-full bg-primary items-center justify-center">
            <Text className="text-[10px] font-bold text-white">{cartCount}</Text>
          </View>
        )}
      </Pressable>
      <Pressable onPress={onLogout} className="flex-row items-center gap-1">
        <LogOut size={16} color="#677E73" />
        <Text className="text-xs text-muted-foreground">Déco.</Text>
      </Pressable>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#FCFCFC' }}>
      <MobileHeader title="Offres anti-gaspi" rightAction={cartButton} />

      <View className="px-4 pt-4 gap-4">
        {/* Search */}
        <View className="flex-row items-center bg-card border border-border rounded-2xl px-3.5 py-3 gap-2">
          <Search size={16} color="#677E73" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Rechercher un produit..."
            placeholderTextColor="#677E73"
            className="flex-1 text-sm text-foreground"
          />
        </View>

        {/* Categories */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-4 px-4">
          <View className="flex-row gap-2 pb-1">
            {categories.map((cat) => (
              <Pressable
                key={cat}
                onPress={() => setCategory(cat)}
                className={`px-4 py-2 rounded-full active:opacity-80 ${
                  category === cat
                    ? 'bg-primary shadow-sm'
                    : 'bg-muted'
                }`}
              >
                <Text
                  className={`text-xs font-semibold ${
                    category === cat ? 'text-primary-foreground' : 'text-muted-foreground'
                  }`}
                >
                  {cat}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </View>

      <View className="px-4 pt-2 pb-1">
        <Text className="text-xs text-muted-foreground">
          {filtered.length} résultat{filtered.length > 1 ? 's' : ''}
        </Text>
      </View>

      {/* Products */}
      {loadingProducts ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#1F5134" />
        </View>
      ) : filtered.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-muted-foreground">Aucun produit trouvé</Text>
          <Pressable onPress={() => { setSearch(''); setCategory('Tout'); }} className="mt-3">
            <Text className="text-primary text-sm font-medium">Réinitialiser</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          numColumns={1}
          contentContainerStyle={{ padding: 16, gap: 16 }}
          renderItem={({ item }) => (
            <ProductCard product={item} onAddToCart={onAddToCart} />
          )}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}
