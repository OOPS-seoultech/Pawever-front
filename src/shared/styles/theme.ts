import { Platform } from 'react-native';

const serif = Platform.select({
  android: 'serif',
  default: 'serif',
  ios: 'Georgia',
});

const sans = Platform.select({
  android: 'sans-serif',
  default: 'sans-serif',
  ios: 'System',
});

export const theme = {
  colors: {
    accent: '#C46E4E',
    accentMuted: '#F1D8CF',
    accentStrong: '#9A4A2C',
    canvas: '#F6F0E7',
    error: '#A33C33',
    glow: '#F0D6B9',
    ink: '#1F2430',
    line: '#E4D8CA',
    shadow: '#352013',
    subdued: '#5C6675',
    surface: '#FFF9F3',
    surfaceMuted: '#F9F3EA',
  },
  radius: {
    md: 16,
    lg: 28,
  },
  spacing: {
    xs: 6,
    sm: 12,
    md: 16,
    lg: 24,
    xl: 32,
  },
  typography: {
    body: {
      fontFamily: sans,
      fontSize: 16,
    },
    display: {
      fontFamily: serif,
      fontSize: 34,
      fontWeight: '700' as const,
      letterSpacing: -0.8,
    },
    label: {
      fontFamily: sans,
      fontSize: 14,
      fontWeight: '600' as const,
      letterSpacing: 0.4,
    },
    title: {
      fontFamily: sans,
      fontSize: 20,
      fontWeight: '700' as const,
    },
  },
} as const;
