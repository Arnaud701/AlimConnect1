import React from 'react';
import { View, Text } from 'react-native';
import { MapPin } from 'lucide-react-native';
import MobileHeader from '@/components/MobileHeader';

export default function MapScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: '#FCFCFC' }}>
      <MobileHeader title="Carte" />
      <View className="flex-1 items-center justify-center px-8 gap-4">
        <View className="w-16 h-16 rounded-full bg-accent items-center justify-center">
          <MapPin size={32} color="#1F5134" />
        </View>
        <Text className="text-lg font-bold text-foreground text-center">
          Carte interactive
        </Text>
        <Text className="text-sm text-muted-foreground text-center">
          La carte des commerces partenaires sera disponible prochainement.
        </Text>
      </View>
    </View>
  );
}
