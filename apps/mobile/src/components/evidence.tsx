import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Evidence } from '../lib/schema';
import { evidenceDetails, evidenceUnit, formatReportedValue } from '../lib/evidence';
import { FinancialValue } from './financial-value';
import { colors, radius, spacing, typography } from './theme';
import { Button, Card, Copy, dateLabel, Eyebrow, Heading, s } from './ui';

export function EvidenceHeader({ onClose }: { onClose: () => void }) {
  return (
    <View style={styles.header}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Close evidence"
        onPress={onClose}
        style={({ pressed }) => [styles.close, pressed && { backgroundColor: colors.actionTint }]}
      >
        <Copy style={styles.closeText}>Close</Copy>
      </Pressable>
      <View style={{ flexShrink: 1 }}>
        <Heading>Evidence</Heading>
      </View>
    </View>
  );
}

export function EvidenceCard({
  source,
  onOpen,
}: {
  source: Evidence;
  onOpen: (url: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const details = evidenceDetails(source);
  const financial = source.kind === 'reported_fact';
  return (
    <View testID={`evidence-${source.id}`}>
      <Card>
        <Heading>{financial ? details.label || 'Reported financial fact' : source.title}</Heading>
        {financial && !details.label && (
          <Copy style={s.muted}>
            A readable label is unavailable. The original concept is in Technical details.
          </Copy>
        )}
        {financial && (
          <>
            <View style={{ gap: spacing.xs }}>
              <FinancialValue>{formatReportedValue(details.value, details.unit)}</FinancialValue>
              <Copy style={s.label}>{evidenceUnit(details.unit)}</Copy>
            </View>
            <View style={{ gap: spacing.xs }}>
              <Copy style={s.label}>{details.start ? 'Reporting period' : 'As of'}</Copy>
              <Copy>
                {details.end
                  ? `${details.start ? `${dateLabel(details.start)} – ` : ''}${dateLabel(details.end)}`
                  : 'Reporting period unavailable.'}
              </Copy>
            </View>
          </>
        )}
        <Copy style={s.muted}>
          {details.form || 'Filing type unavailable'}
          {details.filed ? ` · Filed ${dateLabel(details.filed)}` : ' · Filing date unavailable'}
        </Copy>
        <Button title="Open SEC filing" onPress={() => onOpen(source.url)} />
        {!details.structured ? (
          <View style={{ gap: spacing.sm }}>
            <Eyebrow>
              {source.kind === 'management_statement'
                ? 'Retained filing excerpt'
                : source.kind === 'company_identity'
                  ? 'SEC company information'
                  : 'Retained source text'}
            </Eyebrow>
            <Copy selectable>{source.excerpt}</Copy>
          </View>
        ) : (
          <Copy style={s.muted}>
            Structured SEC data. The retained record is available in Technical details.
          </Copy>
        )}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Technical details"
          accessibilityState={{ expanded }}
          aria-expanded={expanded}
          onPress={() => setExpanded((value) => !value)}
          style={({ pressed }) => [
            styles.disclosure,
            pressed && { backgroundColor: colors.actionTint },
          ]}
        >
          <Copy style={styles.closeText}>{expanded ? '−' : '+'} Technical details</Copy>
        </Pressable>
        {expanded && (
          <View style={{ gap: spacing.md }} testID="technical-details">
            <Copy selectable style={s.muted}>
              Original title: {source.title}
            </Copy>
            <Copy selectable style={s.muted}>
              Original concept: {details.concept || 'Not supplied'}
            </Copy>
            <Copy selectable style={s.muted}>
              Taxonomy: {details.taxonomy || 'Not supplied'}
            </Copy>
            <Copy selectable style={s.muted}>
              Original unit: {details.unit || 'Not supplied'}
            </Copy>
            <Copy selectable style={s.muted}>
              Accession: {details.accession || 'Not supplied'}
            </Copy>
            <Copy selectable style={s.muted}>
              Retrieved: {source.retrieved_at}
            </Copy>
            {details.structured && (
              <>
                <Eyebrow>Raw structured record (JSON)</Eyebrow>
                <Copy selectable>{source.excerpt}</Copy>
              </>
            )}
            {source.data_url !== source.url && (
              <Button
                title="Open structured SEC data"
                secondary
                onPress={() => onOpen(source.data_url)}
              />
            )}
          </View>
        )}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  close: {
    minWidth: 60,
    minHeight: 48,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    justifyContent: 'center',
    borderRadius: radius.control,
  },
  closeText: { ...typography.action, color: colors.actionPrimary },
  disclosure: {
    minHeight: 48,
    paddingVertical: spacing.md,
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
});
