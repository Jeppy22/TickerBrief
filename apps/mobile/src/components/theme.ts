import palette from './colors.json';

export const colors = palette;
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };
export const radius = { control: 8, surface: 10 };

// No bundled/custom font: React Native uses the platform's system font.
// Font scaling remains enabled on all app text.
export const typography = {
  title: { fontSize: 28, lineHeight: 34, fontWeight: '700' },
  heading: { fontSize: 18, lineHeight: 26, fontWeight: '600' },
  body: { fontSize: 16, lineHeight: 24 },
  label: { fontSize: 14, lineHeight: 20 },
  eyebrow: { fontSize: 12, lineHeight: 18, fontWeight: '600', letterSpacing: 0.6 },
  action: { fontSize: 15, lineHeight: 21, fontWeight: '600' },
  amount: { fontSize: 20, lineHeight: 28, fontWeight: '600' },
} as const;
