import { Tabs, TabList, TabSlot, TabTrigger, TabTriggerSlotProps } from 'expo-router/ui';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../components/ui';

function TabButton({ children, isFocused, ...props }: TabTriggerSlotProps) {
  return (
    <Pressable
      {...props}
      accessibilityRole="tab"
      accessibilityState={{ selected: isFocused }}
      style={{
        flex: 1,
        paddingVertical: 16,
        alignItems: 'center',
        minHeight: 52,
        borderTopWidth: 3,
        borderTopColor: isFocused ? colors.teal : 'transparent',
      }}
    >
      <Text
        style={{
          color: isFocused ? colors.teal : colors.muted,
          fontSize: 12,
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
            backgroundColor: colors.paper,
            borderTopWidth: 1,
            borderColor: colors.line,
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
