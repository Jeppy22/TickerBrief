import assert from 'node:assert/strict';
import colors from '../src/components/colors.json';

// WCAG 2.2 relative luminance: test actual token values without rounding thresholds.
// Decorative dividers are not control boundaries; inputs use inputBorder instead.
function luminance(hex: string) {
  const channels = hex.match(/[a-f\d]{2}/gi)!.map((channel) => {
    const value = parseInt(channel, 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}
type Token = keyof typeof colors;
const pairs: [Token, Token, number][] = [
  ['textPrimary', 'surface', 4.5],
  ['textPrimary', 'pageBackground', 4.5],
  ['textSecondary', 'surface', 4.5],
  ['textSecondary', 'pageBackground', 4.5],
  ['textSecondary', 'divider', 4.5],
  ['actionPrimary', 'surface', 4.5],
  ['actionPrimary', 'pageBackground', 4.5],
  ['actionPrimary', 'actionTint', 4.5],
  ['onAction', 'actionPrimary', 4.5],
  ['onAction', 'actionPressed', 4.5],
  ['onAction', 'errorText', 4.5],
  ['errorText', 'surface', 4.5],
  ['errorText', 'errorSurface', 4.5],
  ['warningText', 'warningSurface', 4.5],
  ['successText', 'successSurface', 4.5],
  ['inputBorder', 'surface', 3],
  ['inputBorder', 'pageBackground', 3],
];
const results = pairs.map(([foreground, background, minimum]) => {
  const light = luminance(colors[foreground]);
  const dark = luminance(colors[background]);
  const ratio = (Math.max(light, dark) + 0.05) / (Math.min(light, dark) + 0.05);
  assert(ratio >= minimum, `${foreground} on ${background}: ${ratio} < ${minimum}`);
  return { foreground, background, ratio, minimum };
});
console.log(JSON.stringify({ standard: 'WCAG 2.2 AA', results }, null, 2));
