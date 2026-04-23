import React from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import BottomTabBar from '@/components/BottomTabBar';

export default function SellerLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: '#FCFCFC' }}>
      <Stack screenOptions={{ headerShown: false }} />
      <BottomTabBar mode="seller" />
    </View>
  );
}
