import { Tabs, TabList, TabSlot, TabTrigger, TabTriggerSlotProps } from 'expo-router/ui';
import { Pressable, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../components/ui';
import { spacing } from '../../components/theme';

function TabButton({ children, isFocused, ...props }: TabTriggerSlotProps) {
  const { fontScale } = useWindowDimensions();
  return (
    <Pressable
      {...props}
      accessibilityRole="tab"
      accessibilityState={{ selected: isFocused }}
      style={{
        flexGrow: 1,
        flexShrink: 0,
        flexBasis: fontScale > 1.4 ? '50%' : 'auto',
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.xs,
        minWidth: 60,
        alignItems: 'center',
        minHeight: 52,
        borderTopWidth: 3,
        borderTopColor: isFocused ? colors.actionPrimary : 'transparent',
      }}
    >
      <Text
        style={{
          color: isFocused ? colors.actionPrimary : colors.textSecondary,
          fontSize: 12,
          lineHeight: 18,
          textAlign: 'center',
          fontWeight: isFocused ? '700' : '500',
        }}
      >
        {children}
      </Text>
    </Pressable>
  );
}
export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  return (
    <Tabs style={{ flex: 1 }}>
      <TabSlot style={{ flex: 1 }} />
      <TabList asChild>
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            backgroundColor: colors.surface,
            borderTopWidth: 1,
            borderColor: colors.divider,
            paddingBottom: insets.bottom,
          }}
        >
          <TabTrigger name="search" href="/" asChild>
            <TabButton>Search</TabButton>
          </TabTrigger>
          <TabTrigger name="watchlist" href="/watchlist" asChild>
            <TabButton>Watchlist</TabButton>
          </TabTrigger>
          <TabTrigger name="saved" href="/saved" asChild>
            <TabButton>Saved Research</TabButton>
          </TabTrigger>
          <TabTrigger name="settings" href="/settings" asChild>
            <TabButton>Settings</TabButton>
          </TabTrigger>
        </View>
      </TabList>
    </Tabs>
  );
}
