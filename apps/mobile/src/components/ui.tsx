import { Children, PropsWithChildren, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextProps,
  TextInput,
  TextInputProps,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, spacing, typography } from './theme';

export { colors } from './theme';
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
export function Section({ children }: PropsWithChildren) {
  return <View style={s.section}>{children}</View>;
}
export function Actions({ children }: PropsWithChildren) {
  const { fontScale } = useWindowDimensions();
  return (
    <View style={s.actions}>
      {Children.map(children, (child) => (
        <View style={{ flexGrow: 1, flexBasis: fontScale > 1.4 ? '100%' : 150 }}>{child}</View>
      ))}
    </View>
  );
}
export function Input(props: TextInputProps) {
  const [focused, setFocused] = useState(false);
  return (
    <TextInput
      {...props}
      placeholderTextColor={colors.textSecondary}
      selectionColor={colors.actionPrimary}
      style={[s.input, focused && s.inputFocused, props.style]}
      onFocus={(event) => {
        setFocused(true);
        props.onFocus?.(event);
      }}
      onBlur={(event) => {
        setFocused(false);
        props.onBlur?.(event);
      }}
    />
  );
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
        danger && {
          borderColor: colors.errorText,
          backgroundColor: secondary ? colors.surface : colors.errorText,
        },
        pressed &&
          !disabled && {
            backgroundColor: danger
              ? secondary
                ? colors.errorSurface
                : colors.errorText
              : secondary
                ? colors.actionTint
                : colors.actionPressed,
          },
        disabled && s.disabledButton,
      ]}
    >
      <Text
        style={[
          s.buttonText,
          secondary && { color: danger ? colors.errorText : colors.actionPrimary },
          disabled && { color: colors.textSecondary },
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}
export function Notice({
  children,
  error = false,
  tone = 'info',
}: PropsWithChildren<{
  error?: boolean;
  tone?: 'info' | 'warning' | 'success';
}>) {
  const status = error
    ? { text: colors.errorText, background: colors.errorSurface }
    : tone === 'warning'
      ? { text: colors.warningText, background: colors.warningSurface }
      : tone === 'success'
        ? { text: colors.successText, background: colors.successSurface }
        : { text: colors.textSecondary, background: colors.pageBackground };
  return (
    <View
      accessibilityRole={error || tone === 'warning' ? 'alert' : undefined}
      style={[s.notice, { backgroundColor: status.background, borderLeftColor: status.text }]}
    >
      <Copy style={{ color: status.text }}>{children}</Copy>
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
      <ActivityIndicator color={colors.actionPrimary} />
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
  safe: { flex: 1, backgroundColor: colors.pageBackground },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
  },
  copy: { color: colors.textPrimary, ...typography.body },
  title: { ...typography.title, color: colors.textPrimary },
  heading: { color: colors.textPrimary, ...typography.heading },
  eyebrow: {
    color: colors.textSecondary,
    ...typography.eyebrow,
    textTransform: 'uppercase',
  },
  card: {
    padding: spacing.lg,
    borderRadius: radius.surface,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.divider,
    gap: spacing.md,
  },
  section: {
    gap: spacing.md,
    paddingVertical: spacing.xs,
    paddingBottom: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  metric: {
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingTop: spacing.lg,
    marginTop: spacing.xs,
  },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  button: {
    backgroundColor: colors.actionPrimary,
    borderWidth: 1,
    borderColor: colors.actionPrimary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.control,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondary: { backgroundColor: colors.surface, borderColor: colors.inputBorder },
  disabledButton: { backgroundColor: colors.divider, borderColor: colors.divider },
  buttonText: { color: colors.onAction, ...typography.action, textAlign: 'center' },
  notice: { padding: spacing.md, borderLeftWidth: 3, borderRadius: 4 },
  loading: { paddingVertical: spacing.lg, gap: spacing.md, alignItems: 'center' },
  input: {
    borderWidth: 2,
    borderColor: colors.inputBorder,
    backgroundColor: colors.surface,
    color: colors.textPrimary,
    outlineColor: colors.actionPrimary,
    ...typography.body,
    padding: spacing.md,
    borderRadius: radius.control,
    minHeight: 50,
  },
  inputFocused: { borderColor: colors.actionPrimary },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  muted: { color: colors.textSecondary, ...typography.label },
  label: { color: colors.textSecondary, ...typography.label, fontWeight: '600' },
  divider: { borderTopWidth: 1, borderColor: colors.divider, marginVertical: spacing.sm },
});
