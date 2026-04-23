import React from 'react';
import { View, Text, Image, Pressable } from 'react-native';
import { MapPin, Star, ChevronRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Seller } from '@/lib/mock-data';

interface SellerCardProps {
  seller: Seller;
}

export default function SellerCard({ seller }: SellerCardProps) {
  const router = useRouter();

  return (
    <Pressable
      onPress={() => router.push(`/marketplace?seller=${seller.id}` as any)}
      className="flex-row gap-4 bg-card rounded-xl border border-border p-4 shadow-sm active:opacity-90"
    >
      <Image
        source={{ uri: seller.image }}
        className="w-20 h-20 rounded-lg"
        resizeMode="cover"
      />
      <View className="flex-1">
        <View className="flex-row items-start justify-between">
          <View className="flex-1">
            <Text className="font-semibold text-foreground" numberOfLines={1}>
              {seller.name}
            </Text>
            <View className="mt-1 self-start bg-secondary px-2 py-0.5 rounded-full">
              <Text className="text-xs font-medium text-secondary-foreground capitalize">
                {seller.type}
              </Text>
            </View>
          </View>
          <ChevronRight size={20} color="#677E73" style={{ marginTop: 2 }} />
        </View>

        <View className="flex-row items-center gap-3 mt-2">
          <View className="flex-row items-center gap-1">
            <Star size={14} color="#F59F0A" fill="#F59F0A" />
            <Text className="text-sm font-medium text-foreground">{seller.rating}</Text>
            <Text className="text-sm text-muted-foreground">({seller.reviewCount})</Text>
          </View>
          <View className="flex-row items-center gap-1">
            <MapPin size={14} color="#677E73" />
            <Text className="text-sm text-muted-foreground">{seller.distance}</Text>
          </View>
        </View>

        <Text className="text-xs text-muted-foreground mt-1" numberOfLines={1}>
          {seller.address}
        </Text>
      </View>
    </Pressable>
  );
}
