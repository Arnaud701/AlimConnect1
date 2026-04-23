import React from 'react';
import { View, Text, Image, Pressable } from 'react-native';
import { Clock, Star } from 'lucide-react-native';
import {
  Product,
  sellers,
  getDaysUntilExpiry,
  getExpiryLabel,
  getDiscountPercentage,
} from '@/lib/mock-data';
import { formatPriceFcfa } from '@/lib/utils';

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
}

export default function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const days = getDaysUntilExpiry(product.expiryDate);
  const expiry = getExpiryLabel(days);
  const discount = getDiscountPercentage(product.originalPrice, product.reducedPrice);
  const seller = sellers.find((s) => s.id === product.sellerId);

  return (
    <View className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
      {/* Image */}
      <View className="relative">
        <Image
          source={{ uri: product.image }}
          className="w-full h-36"
          resizeMode="cover"
        />
        {/* Discount badge */}
        <View className="absolute top-3 left-3 bg-primary px-2.5 py-1 rounded-full">
          <Text className="text-primary-foreground text-xs font-bold">-{discount}%</Text>
        </View>
        {/* Expiry badge */}
        <View
          className={`absolute top-3 right-3 flex-row items-center gap-1 px-2.5 py-1 rounded-full ${
            expiry.urgent ? 'bg-destructive' : 'bg-card/90'
          }`}
        >
          <Clock size={12} color={expiry.urgent ? '#FFFFFF' : '#677E73'} />
          <Text
            className={`text-xs font-medium ${
              expiry.urgent ? 'text-destructive-foreground' : 'text-muted-foreground'
            }`}
          >
            {expiry.text}
          </Text>
        </View>
      </View>

      {/* Content */}
      <View className="p-4 gap-3">
        <View>
          <Text className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
            {product.category}
          </Text>
          <Text className="font-semibold text-foreground mt-1 leading-snug" numberOfLines={2}>
            {product.name}
          </Text>
        </View>

        <Text className="text-sm text-muted-foreground" numberOfLines={2}>
          {product.description}
        </Text>

        {/* Seller */}
        {seller && (
          <View className="flex-row items-center gap-2">
            <View className="flex-row items-center gap-1">
              <Star size={12} color="#F59F0A" fill="#F59F0A" />
              <Text className="text-xs font-medium text-foreground">{seller.rating}</Text>
            </View>
            <Text className="text-xs text-muted-foreground">·</Text>
            <Text className="text-xs text-muted-foreground">{seller.name}</Text>
            <Text className="text-xs text-muted-foreground">·</Text>
            <Text className="text-xs text-muted-foreground">{seller.distance}</Text>
          </View>
        )}

        {/* Price */}
        <View className="flex-row items-end justify-between pt-2 border-t border-border">
          <View className="flex-row items-baseline gap-2">
            <Text className="text-lg font-bold text-primary">
              {formatPriceFcfa(product.reducedPrice)}
            </Text>
            <Text className="text-sm text-muted-foreground line-through">
              {formatPriceFcfa(product.originalPrice)}
            </Text>
          </View>
          <Pressable
            onPress={() => onAddToCart?.(product)}
            className="px-4 py-2 bg-primary rounded-lg active:opacity-80"
          >
            <Text className="text-primary-foreground text-sm font-medium">Ajouter</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
