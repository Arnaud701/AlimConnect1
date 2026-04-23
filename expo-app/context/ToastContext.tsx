import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { Animated, Text, View } from 'react-native';

interface ToastOptions {
  title: string;
  description?: string;
  type?: 'success' | 'error' | 'info';
}

interface ToastContextType {
  toast: (options: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextType>({ toast: () => {} });

export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toastData, setToastData] = useState<ToastOptions | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toast = useCallback((options: ToastOptions) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    setToastData(options);
    Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(2200),
      Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => setToastData(null));
  }, [opacity]);

  const bgColor =
    toastData?.type === 'error'
      ? 'bg-destructive'
      : toastData?.type === 'success'
      ? 'bg-success'
      : 'bg-foreground';

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {toastData && (
        <Animated.View
          style={{ opacity, position: 'absolute', bottom: 90, left: 16, right: 16, zIndex: 999 }}
        >
          <View className={`${bgColor} rounded-2xl px-4 py-3 shadow-lg`}>
            <Text className="text-white font-semibold text-sm">{toastData.title}</Text>
            {toastData.description ? (
              <Text className="text-white/80 text-xs mt-0.5">{toastData.description}</Text>
            ) : null}
          </View>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}
