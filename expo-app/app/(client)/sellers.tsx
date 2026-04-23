import React from 'react';
import { View, Text, FlatList } from 'react-native';
import MobileHeader from '@/components/MobileHeader';
import SellerCard from '@/components/SellerCard';
import { sellers } from '@/lib/mock-data';

export default function SellersScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: '#FCFCFC' }}>
      <MobileHeader title="Vendeurs partenaires" />
      <FlatList
        data={sellers}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <Text className="text-xs text-muted-foreground mb-1">
            {sellers.length} commerces près de vous
          </Text>
        }
        renderItem={({ item }) => <SellerCard seller={item} />}
      />
    </View>
  );
}
