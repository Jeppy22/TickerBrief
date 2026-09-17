import { PropsWithChildren, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextProps,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export const colors = {
  paper: '#F6F5F0',
  ink: '#142D35',
  muted: '#53686D',
  line: '#D6DED9',
  teal: '#136C60',
  pale: '#E4EEE8',
  white: '#FFFFFF',
  warning: '#785315',
  warningBg: '#F5EDDB',
  danger: '#9D3333',
};
export function Copy(props: TextProps) {
  return <Text {...props} style={[s.copy, props.style]} />;
}
export function Title({ children }: PropsWithChildren) {
  return (
    <Text accessibilityRole="header" style={s.title}>
      {children}
    </Text>
  );
}
export function Heading({ children }: PropsWithChildren) {
  return (
    <Text accessibilityRole="header" style={s.heading}>
      {children}
    </Text>
  );
}
export function Eyebrow({ children }: PropsWithChildren) {
  return <Text style={s.eyebrow}>{children}</Text>;
}
export function Screen({ children }: PropsWithChildren) {
  return (
    <SafeAreaView style={s.safe} edges={['top', 'left', 'right']}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.content}>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}
export function Card({ children }: PropsWithChildren) {
  return <View style={s.card}>{children}</View>;
}
export function Button({
  title,
  onPress,
  secondary,
  disabled,
  danger,
  label,
}: {
  title: string;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
  danger?: boolean;
  label?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label || title}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        s.button,
        secondary && s.secondary,
        danger && { borderColor: colors.danger },
        (disabled || pressed) && { opacity: 0.55 },
      ]}
    >
      <Text style={[s.buttonText, secondary && { color: danger ? colors.danger : colors.teal }]}>
        {title}
      </Text>
    </Pressable>
  );
}
export function Notice({ children, error = false }: PropsWithChildren<{ error?: boolean }>) {
  return (
    <View
      accessibilityRole={error ? 'alert' : undefined}
      style={[s.notice, error && { backgroundColor: colors.warningBg }]}
    >
      <Copy style={{ color: error ? colors.warning : colors.muted }}>{children}</Copy>
    </View>
  );
}
export function Loading({
  label = 'Loading research…',
  slowHint,
}: {
  label?: string;
  slowHint?: string;
}) {
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    if (!slowHint) return;
    const timer = setTimeout(() => setSlow(true), 10000);
    return () => clearTimeout(timer);
  }, [slowHint]);
  return (
    <View style={s.loading}>
      <ActivityIndicator color={colors.teal} />
      <Copy>{label}</Copy>
      {slow && Boolean(slowHint) && <Notice>{slowHint}</Notice>}
    </View>
  );
}
export function dateLabel(value: string) {
  return new Date(value.length === 10 ? `${value}T12:00:00Z` : value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}
export function money(value: number | undefined) {
  if (value === undefined) return 'Unavailable';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 2,
  }).format(value);
}
export const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 22,
    paddingBottom: 48,
    gap: 18,
    width: '100%',
    maxWidth: 820,
    alignSelf: 'center',
  },
  copy: { color: colors.ink, fontSize: 16, lineHeight: 25 },
  title: { fontSize: 36, fontWeight: '700', letterSpacing: -1, color: colors.ink, lineHeight: 43 },
  heading: { color: colors.ink, fontSize: 23, lineHeight: 30, fontWeight: '700' },
  eyebrow: {
    color: colors.teal,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  },
  card: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderRadius: 18,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    gap: 12,
  },
  button: {
    backgroundColor: colors.teal,
    borderWidth: 1,
    borderColor: colors.teal,
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderRadius: 12,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondary: { backgroundColor: 'transparent' },
  buttonText: { color: colors.white, fontSize: 15, fontWeight: '700' },
  notice: { padding: 16, backgroundColor: colors.pale, borderRadius: 12 },
  loading: { padding: 26, gap: 14, alignItems: 'center' },
  input: {
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
    color: colors.ink,
    fontSize: 17,
    padding: 16,
    borderRadius: 12,
    minHeight: 54,
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  muted: { color: colors.muted, fontSize: 14, lineHeight: 21 },
  divider: { borderTopWidth: 1, borderColor: colors.line, marginVertical: 6 },
});
