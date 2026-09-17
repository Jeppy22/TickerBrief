import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { colors } from '../components/ui';
import { LibraryProvider } from '../lib/library';

export default function Layout() {
  return (
    <SafeAreaProvider>
      <LibraryProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.paper },
            headerTintColor: colors.ink,
            headerBackTitle: 'Back',
            headerBackButtonDisplayMode: 'generic',
            contentStyle: { backgroundColor: colors.paper },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false, title: 'TickerBrief' }} />
          <Stack.Screen name="report/[ticker]" options={{ title: 'Research brief' }} />
          <Stack.Screen name="saved/[id]" options={{ title: 'Saved research' }} />
        </Stack>
      </LibraryProvider>
    </SafeAreaProvider>
  );
}
