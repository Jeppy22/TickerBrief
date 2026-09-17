import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, Copy, s } from './ui';

/** Keep an amount atomic. Large accessibility text can scroll instead of losing digits. */
export function FinancialValue({ children }: { children: string }) {
  const [viewportWidth, setViewportWidth] = useState(0);
  const [textWidth, setTextWidth] = useState(0);
  const overflows = viewportWidth > 0 && textWidth > viewportWidth + 1;
  return (
    <View style={{ gap: 4 }}>
      <ScrollView
        horizontal
        style={{ flexGrow: 0 }}
        contentContainerStyle={{ paddingBottom: 4 }}
        onLayout={(event) => setViewportWidth(event.nativeEvent.layout.width)}
        onContentSizeChange={(width) => setTextWidth(width)}
        showsHorizontalScrollIndicator
        testID="financial-value-viewport"
      >
        <Text selectable style={styles.value} testID="financial-value">
          {children}
        </Text>
      </ScrollView>
      {overflows && <Copy style={s.muted}>Swipe across the value to read every digit.</Copy>}
    </View>
  );
}

const styles = StyleSheet.create({
  value: {
    color: colors.ink,
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
    flexShrink: 0,
  },
});
