export const colors = {
  light: {
    background: '#f5f6f8',
    foreground: '#1a1d24',
    card: '#ffffff',
    cardForeground: '#1a1d24',
    primary: '#2d9d5e',
    primaryForeground: '#ffffff',
    secondary: '#e4e6eb',
    secondaryForeground: '#2d3039',
    muted: '#f0f1f4',
    mutedForeground: '#6b7280',
    accent: '#e8f5ee',
    accentForeground: '#1e6b3d',
    destructive: '#ef4444',
    destructiveForeground: '#ffffff',
    border: '#dfe1e6',
    input: '#dfe1e6',
    ring: '#2d9d5e',
    // Custom
    success: '#22c55e',
    warning: '#f59e0b',
    info: '#3b82f6',
  },
  dark: {
    background: '#0f1419',
    foreground: '#e8eaed',
    card: '#1a2028',
    cardForeground: '#e8eaed',
    primary: '#3eb073',
    primaryForeground: '#0f1419',
    secondary: '#252d38',
    secondaryForeground: '#d1d5db',
    muted: '#1f2630',
    mutedForeground: '#8b95a5',
    accent: '#1a3328',
    accentForeground: '#5fd992',
    destructive: '#dc2626',
    destructiveForeground: '#ffffff',
    border: '#2a3440',
    input: '#2a3440',
    ring: '#3eb073',
    // Custom
    success: '#22c55e',
    warning: '#f59e0b',
    info: '#3b82f6',
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
};

export const borderRadius = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  full: 9999,
};

export const fontSize = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
};

export const fontWeight = {
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};
