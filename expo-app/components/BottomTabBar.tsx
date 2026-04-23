import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ShoppingBag, Store, MapPin, Home, Plus, Package } from 'lucide-react-native';

interface BottomTabBarProps {
  mode: 'client' | 'seller';
}

const clientTabs = [
  { to: '/marketplace', label: 'Produits', icon: ShoppingBag },
  { to: '/sellers', label: 'Vendeurs', icon: Store },
  { to: '/', label: 'Accueil', icon: Home },
  { to: '/map', label: 'Carte', icon: MapPin },
  { to: '/seller/dashboard', label: 'Vendeur', icon: Package },
];

const sellerTabs = [
  { to: '/seller/dashboard', label: 'Produits', icon: Package },
  { to: '/seller/add', label: 'Ajouter', icon: Plus },
  { to: '/marketplace', label: 'Client', icon: ShoppingBag },
];

export default function BottomTabBar({ mode }: BottomTabBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  const tabs = mode === 'client' ? clientTabs : sellerTabs;

  return (
    <View
      style={{ paddingBottom: insets.bottom }}
      className="bg-card border-t border-border"
    >
      <View className="flex-row items-center justify-around h-16 px-2">
        {tabs.map((tab) => {
          const isActive = pathname === tab.to;
          const isCenter = mode === 'client' && tab.to === '/';
          const Icon = tab.icon;

          if (isCenter) {
            return (
              <Pressable
                key={tab.to}
                onPress={() => router.push('/')}
                className="flex-1 items-center justify-center"
              >
                <View
                  className={`w-12 h-12 -mt-5 rounded-full items-center justify-center shadow-lg ${
                    isActive ? 'bg-primary scale-110' : 'bg-primary'
                  }`}
                >
                  <Icon size={20} color="#FFFFFF" />
                </View>
              </Pressable>
            );
          }

          return (
            <Pressable
              key={tab.to}
              onPress={() => router.push(tab.to as any)}
              className="flex-1 items-center justify-center py-1 relative"
            >
              {isActive && (
                <View className="absolute top-0 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-primary rounded-full" />
              )}
              <Icon size={20} color={isActive ? '#1F5134' : '#677E73'} />
              <Text
                className={`text-[10px] font-medium mt-0.5 ${
                  isActive ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
