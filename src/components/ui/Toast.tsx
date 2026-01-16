import React, { createContext, useContext, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { borderRadius, fontSize, fontWeight, spacing } from '@/constants/theme';

interface ToastData {
  id: string;
  title: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success';
}

interface ToastContextType {
  toast: (data: Omit<ToastData, 'id'>) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const { colors } = useTheme();

  const toast = useCallback((data: Omit<ToastData, 'id'>) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { ...data, id }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const getBackgroundColor = (variant?: string) => {
    switch (variant) {
      case 'destructive':
        return colors.destructive;
      case 'success':
        return colors.success;
      default:
        return colors.card;
    }
  };

  const getTextColor = (variant?: string) => {
    switch (variant) {
      case 'destructive':
      case 'success':
        return '#ffffff';
      default:
        return colors.foreground;
    }
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <View style={styles.container} pointerEvents="box-none">
        {toasts.map((t) => (
          <TouchableOpacity
            key={t.id}
            style={[
              styles.toast,
              {
                backgroundColor: getBackgroundColor(t.variant),
                borderColor: colors.border,
              },
            ]}
            onPress={() => dismissToast(t.id)}
            activeOpacity={0.9}
          >
            <Text
              style={[
                styles.title,
                { color: getTextColor(t.variant) },
              ]}
            >
              {t.title}
            </Text>
            {t.description && (
              <Text
                style={[
                  styles.description,
                  {
                    color: t.variant
                      ? 'rgba(255,255,255,0.8)'
                      : colors.mutedForeground,
                  },
                ]}
              >
                {t.description}
              </Text>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: spacing.md,
    right: spacing.md,
    zIndex: 9999,
    gap: spacing.sm,
  },
  toast: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  description: {
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
  },
});
