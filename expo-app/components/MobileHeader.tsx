import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Leaf } from 'lucide-react-native';

interface MobileHeaderProps {
  title?: string;
  showLogo?: boolean;
  rightAction?: React.ReactNode;
}

export default function MobileHeader({ title, showLogo = false, rightAction }: MobileHeaderProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={{ paddingTop: insets.top }} className="bg-card border-b border-border">
      <View className="flex-row items-center justify-between h-14 px-4">
        {showLogo ? (
          <Pressable onPress={() => router.push('/')} className="flex-row items-center gap-2">
            <View className="w-8 h-8 rounded-lg bg-primary items-center justify-center">
              <Leaf size={16} color="#FFFFFF" />
            </View>
            <Text className="font-display text-lg font-bold tracking-tight text-foreground">
              AlimConnect
            </Text>
          </Pressable>
        ) : (
          <Text className="text-lg font-bold text-foreground">{title}</Text>
        )}
        {rightAction ? <View>{rightAction}</View> : null}
      </View>
    </View>
  );
}
