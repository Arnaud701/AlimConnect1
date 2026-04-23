import React from 'react';
import { View, Text, Image, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Leaf, ShoppingBag, Store, ArrowRight, TrendingDown, MapPin, Clock } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const heroImage = require('../assets/panier.png');

const steps = [
  { icon: MapPin, title: 'Trouvez un commerce', desc: 'Localisez les vendeurs proches de vous' },
  { icon: ShoppingBag, title: 'Réservez vos produits', desc: 'Choisissez des invendus à prix réduits' },
  { icon: Clock, title: 'Récupérez & savourez', desc: 'Passez au magasin et repartez heureux' },
];

const stats = [
  { value: '12 430', label: 'Produits sauvés' },
  { value: '847', label: 'Commerces' },
  { value: '38 200', label: 'Utilisateurs' },
];

export default function IndexScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: '#FCFCFC' }}>
      {/* Header */}
      <View style={{ paddingTop: insets.top }} className="bg-card border-b border-border">
        <View className="flex-row items-center h-14 px-4 gap-2">
          <View className="w-8 h-8 rounded-lg bg-primary items-center justify-center">
            <Leaf size={16} color="#FFFFFF" />
          </View>
          <Text className="font-display text-lg font-bold tracking-tight text-foreground">
            AlimConnect
          </Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Hero */}
        <View className="px-4 pt-4 pb-8">
          <View className="rounded-2xl overflow-hidden">
            <Image source={heroImage} className="w-full h-56" resizeMode="cover" />
            <View
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                top: 0,
                background: 'transparent',
              }}
            >
              <View
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: '70%',
                  backgroundColor: 'rgba(0,0,0,0.45)',
                  justifyContent: 'flex-end',
                  padding: 20,
                  gap: 12,
                }}
              >
                <View className="self-start flex-row items-center gap-1.5 bg-primary/90 px-3 py-1.5 rounded-full">
                  <TrendingDown size={14} color="#FFFFFF" />
                  <Text className="text-white text-xs font-semibold">Jusqu'à -70%</Text>
                </View>
                <Text style={{ color: '#fff', fontSize: 22, fontWeight: '700', lineHeight: 28 }}>
                  Sauvez des aliments, faites des économies
                </Text>
              </View>
            </View>
          </View>

          {/* Quick actions */}
          <View className="flex-row gap-3 mt-5">
            <Pressable
              onPress={() => router.push('/auth/client' as any)}
              className="flex-1 flex-row items-center gap-3 bg-primary p-4 rounded-2xl active:opacity-90"
            >
              <View className="w-10 h-10 rounded-xl bg-white/20 items-center justify-center">
                <ShoppingBag size={20} color="#FFFFFF" />
              </View>
              <View>
                <Text className="font-semibold text-sm text-white">Acheter</Text>
                <Text className="text-xs text-white/80">Invendus dispo</Text>
              </View>
            </Pressable>
            <Pressable
              onPress={() => router.push('/auth/seller' as any)}
              className="flex-1 flex-row items-center gap-3 bg-card border border-border p-4 rounded-2xl active:opacity-90"
            >
              <View className="w-10 h-10 rounded-xl bg-accent items-center justify-center">
                <Store size={20} color="#1F5134" />
              </View>
              <View>
                <Text className="font-semibold text-sm text-foreground">Vendre</Text>
                <Text className="text-xs text-muted-foreground">Espace pro</Text>
              </View>
            </Pressable>
          </View>
        </View>

        {/* How it works */}
        <View className="px-4 py-8">
          <Text className="text-xl font-bold text-foreground mb-5">Comment ça marche</Text>
          <View className="gap-3">
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <View
                  key={i}
                  className="flex-row items-center gap-4 bg-card rounded-2xl border border-border p-4"
                >
                  <View className="w-12 h-12 rounded-xl bg-accent items-center justify-center flex-shrink-0">
                    <Icon size={24} color="#1F5134" />
                  </View>
                  <View className="flex-1">
                    <Text className="font-semibold text-foreground text-sm">{step.title}</Text>
                    <Text className="text-xs text-muted-foreground mt-0.5">{step.desc}</Text>
                  </View>
                  <ArrowRight size={16} color="#677E73" />
                </View>
              );
            })}
          </View>
        </View>

        {/* Impact */}
        <View className="px-4 py-6">
          <View className="bg-primary rounded-2xl p-6">
            <Text className="text-xs font-semibold text-white/70 uppercase tracking-wider mb-4">
              Notre impact
            </Text>
            <View className="flex-row justify-around">
              {stats.map((stat, i) => (
                <View key={i} className="items-center">
                  <Text className="text-xl font-bold text-white">{stat.value}</Text>
                  <Text className="text-[10px] text-white/70 mt-1 font-medium text-center">
                    {stat.label}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* CTA */}
        <View className="px-4 py-6">
          <View className="items-center gap-4 py-4">
            <View className="w-12 h-12 rounded-full bg-accent items-center justify-center">
              <Leaf size={24} color="#1F5134" />
            </View>
            <Text className="text-xl font-bold text-foreground">Prêt à agir ?</Text>
            <Text className="text-sm text-muted-foreground text-center max-w-xs">
              Rejoignez AlimConnect et luttez contre le gaspillage alimentaire.
            </Text>
            <Pressable
              onPress={() => router.push('/marketplace')}
              className="flex-row items-center gap-2 bg-primary px-6 py-3.5 rounded-2xl active:opacity-90 shadow-lg"
            >
              <Text className="text-white text-sm font-semibold">Commencer</Text>
              <ArrowRight size={16} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>

        {/* Footer */}
        <View className="px-4 py-6 items-center">
          <Text className="text-xs text-muted-foreground">
            © 2026 AlimConnect. Ensemble contre le gaspillage.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
