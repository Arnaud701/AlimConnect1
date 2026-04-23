import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { ArrowLeft, ImagePlus, Check } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { insertProductToDB, uploadProductImage } from '@/lib/mock-data';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

const categories = [
  'Boulangerie',
  'Produits laitiers',
  'Fruits & Légumes',
  'Plats préparés',
  'Viandes',
  'Boissons',
  'Autre',
];

export default function SellerAddProductScreen() {
  const router = useRouter();
  const { toast } = useToast();
  const insets = useSafeAreaInsets();
  const { user, loading } = useAuth();

  const [form, setForm] = useState({
    name: '',
    description: '',
    category: '',
    originalPrice: '',
    reducedPrice: '',
    expiryDate: '',
    quantity: '1',
  });
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'seller')) {
      router.replace('/auth/seller' as any);
    }
  }, [loading, user]);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FCFCFC' }}>
        <ActivityIndicator size="large" color="#1F5134" />
      </View>
    );
  }

  if (!user || user.role !== 'seller') return null;

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      toast({ title: 'Permission refusée', description: "Autorisez l'accès aux photos.", type: 'error' });
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      toast({ title: 'Permission refusée', description: "Autorisez l'accès à la caméra.", type: 'error' });
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  };

  const handleSubmit = async () => {
    if (!imageUri) {
      toast({ title: 'Photo manquante', description: 'Veuillez ajouter une photo du produit.', type: 'error' });
      return;
    }
    if (!form.category) {
      toast({ title: 'Catégorie manquante', description: 'Veuillez choisir une catégorie.', type: 'error' });
      return;
    }
    if (!form.name || !form.originalPrice || !form.reducedPrice || !form.expiryDate) {
      toast({ title: 'Champs manquants', description: 'Veuillez remplir tous les champs.', type: 'error' });
      return;
    }

    setUploading(true);
    try {
      const imageUrl = await uploadProductImage(imageUri, user.id);
      await insertProductToDB({
        name: form.name.trim(),
        description: form.description.trim(),
        category: form.category,
        originalPrice: parseFloat(form.originalPrice),
        reducedPrice: parseFloat(form.reducedPrice),
        expiryDate: form.expiryDate,
        quantity: Math.max(1, parseInt(form.quantity, 10)),
        image: imageUrl,
        sellerId: user.id,
      });

      toast({ title: 'Produit ajouté !', description: `${form.name} est maintenant visible.`, type: 'success' });
      router.replace('/seller/dashboard' as any);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erreur lors de la publication.';
      toast({ title: 'Erreur', description: msg, type: 'error' });
    } finally {
      setUploading(false);
    }
  };

  const discount =
    form.originalPrice && form.reducedPrice
      ? Math.round(
          ((parseFloat(form.originalPrice) - parseFloat(form.reducedPrice)) /
            parseFloat(form.originalPrice)) *
            100,
        )
      : 0;

  const inputClass =
    'w-full px-4 py-3 rounded-2xl border border-border bg-card text-sm text-foreground';

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#FCFCFC' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={{ paddingTop: insets.top }} className="bg-card border-b border-border">
        <View className="flex-row items-center gap-3 h-14 px-4">
          <Pressable
            onPress={() => router.back()}
            className="w-9 h-9 rounded-xl bg-muted items-center justify-center active:opacity-80"
          >
            <ArrowLeft size={20} color="#141F1A" />
          </Pressable>
          <Text className="text-lg font-bold text-foreground">Ajouter un produit</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 20, paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Image picker */}
        <View className="border-2 border-dashed border-border rounded-2xl p-6 items-center">
          {imageUri ? (
            <Image source={{ uri: imageUri }} className="w-28 h-28 rounded-3xl" resizeMode="cover" />
          ) : (
            <>
              <ImagePlus size={32} color="#677E73" />
              <Text className="text-xs text-muted-foreground mt-2">Ajouter une photo</Text>
            </>
          )}
          <View className="flex-row gap-3 mt-3">
            <Pressable onPress={pickImage} className="px-4 py-2 bg-muted rounded-xl active:opacity-80">
              <Text className="text-xs font-medium text-foreground">Galerie</Text>
            </Pressable>
            <Pressable onPress={takePhoto} className="px-4 py-2 bg-muted rounded-xl active:opacity-80">
              <Text className="text-xs font-medium text-foreground">Caméra</Text>
            </Pressable>
          </View>
        </View>

        {/* Nom */}
        <View className="gap-1.5">
          <Text className="text-xs font-semibold text-foreground">Nom du produit</Text>
          <TextInput
            value={form.name}
            onChangeText={(v) => update('name', v)}
            placeholder="Ex: Yaourts nature bio (x6)"
            placeholderTextColor="#677E73"
            className={inputClass}
          />
        </View>

        {/* Description */}
        <View className="gap-1.5">
          <Text className="text-xs font-semibold text-foreground">Description courte</Text>
          <TextInput
            value={form.description}
            onChangeText={(v) => update('description', v)}
            placeholder="Décrivez brièvement le produit..."
            placeholderTextColor="#677E73"
            multiline
            numberOfLines={2}
            className={inputClass}
            style={{ textAlignVertical: 'top', minHeight: 72 }}
          />
        </View>

        {/* Catégorie */}
        <View className="gap-1.5">
          <Text className="text-xs font-semibold text-foreground">Catégorie</Text>
          <View className="flex-row flex-wrap gap-2">
            {categories.map((cat) => (
              <Pressable
                key={cat}
                onPress={() => update('category', cat)}
                className={`px-3 py-1.5 rounded-full active:opacity-80 ${
                  form.category === cat ? 'bg-primary' : 'bg-muted'
                }`}
              >
                <Text
                  className={`text-xs font-semibold ${
                    form.category === cat ? 'text-primary-foreground' : 'text-muted-foreground'
                  }`}
                >
                  {cat}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Prix */}
        <View className="flex-row gap-3">
          <View className="flex-1 gap-1.5">
            <Text className="text-xs font-semibold text-foreground">Prix normal (€)</Text>
            <TextInput
              value={form.originalPrice}
              onChangeText={(v) => update('originalPrice', v)}
              placeholder="4.20"
              placeholderTextColor="#677E73"
              keyboardType="decimal-pad"
              className={inputClass}
            />
          </View>
          <View className="flex-1 gap-1.5">
            <Text className="text-xs font-semibold text-foreground">Prix réduit (€)</Text>
            <TextInput
              value={form.reducedPrice}
              onChangeText={(v) => update('reducedPrice', v)}
              placeholder="1.50"
              placeholderTextColor="#677E73"
              keyboardType="decimal-pad"
              className={inputClass}
            />
          </View>
        </View>
        {discount > 0 && (
          <Text className="text-xs text-primary font-semibold -mt-3">→ Réduction de {discount}%</Text>
        )}

        {/* Date & Quantité */}
        <View className="flex-row gap-3">
          <View className="flex-1 gap-1.5">
            <Text className="text-xs font-semibold text-foreground">Date péremption</Text>
            <TextInput
              value={form.expiryDate}
              onChangeText={(v) => update('expiryDate', v)}
              placeholder="AAAA-MM-JJ"
              placeholderTextColor="#677E73"
              className={inputClass}
            />
          </View>
          <View className="flex-1 gap-1.5">
            <Text className="text-xs font-semibold text-foreground">Quantité</Text>
            <TextInput
              value={form.quantity}
              onChangeText={(v) => update('quantity', v)}
              keyboardType="number-pad"
              className={inputClass}
            />
          </View>
        </View>

        {/* Submit */}
        <Pressable
          onPress={handleSubmit}
          disabled={uploading}
          className="w-full flex-row items-center justify-center gap-2 bg-primary py-4 rounded-2xl active:opacity-90 shadow-lg disabled:opacity-60"
        >
          {uploading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <Check size={20} color="#FFFFFF" />
              <Text className="text-white font-semibold">Publier le produit</Text>
            </>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
