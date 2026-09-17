import { useState } from 'react';
import { Linking, Modal, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Evidence, Report } from '../lib/schema';
import { FinancialValue } from './financial-value';
import { Button, Card, colors, Copy, dateLabel, Eyebrow, Heading, money, Notice, s } from './ui';

export function ReportBody({ report }: { report: Report }) {
  const [selected, setSelected] = useState<Evidence[]>([]);
  const [linkError, setLinkError] = useState(false);
  const inspect = (ids: string[]) => {
    setLinkError(false);
    setSelected(report.sources.filter((source) => ids.includes(source.id)));
  };
  async function open(url: string) {
    try {
      const parsed = new URL(url);
      if (
        parsed.protocol !== 'https:' ||
        !['www.sec.gov', 'data.sec.gov'].includes(parsed.hostname)
      )
        throw new Error();
      await Linking.openURL(url);
    } catch {
      setLinkError(true);
    }
  }
  const content = report.interpretation.content;
  return (
    <>
      <Copy style={s.muted}>
        Data retrieved {dateLabel(report.retrieved_at)} · Brief prepared{' '}
        {dateLabel(report.generated_at)}
      </Copy>
      {report.stale && (
        <Notice error>
          Some sources are stale because a refresh failed. Review the retrieval dates before relying
          on these figures.
        </Notice>
      )}
      <Card>
        <Eyebrow>The business</Eyebrow>
        <Heading>What the company does</Heading>
        {report.overview ? (
          <>
            <Copy style={s.muted}>Management statement · excerpt from 10-K Item 1</Copy>
            <Copy>{report.overview}</Copy>
            <Button
              title="Inspect business source"
              secondary
              onPress={() => inspect(report.overview_source_ids)}
            />
          </>
        ) : (
          <Notice>A sourced business overview is unavailable for this report.</Notice>
        )}
        {Boolean(report.industry) && (
          <>
            <Copy style={s.muted}>SEC industry classification: {report.industry}</Copy>
            <Button
              title="Inspect company identity"
              secondary
              onPress={() =>
                inspect(
                  report.sources
                    .filter((source) => source.kind === 'company_identity')
                    .map((source) => source.id),
                )
              }
            />
          </>
        )}
      </Card>
      {report.periods.map((period) => (
        <View key={period.kind} style={{ gap: 14 }}>
          <Eyebrow>{period.label}</Eyebrow>
          <Heading>
            {dateLabel(period.start)} – {dateLabel(period.end)}
          </Heading>
          {period.kind === 'interim_ytd' && (
            <Notice>
              Revenue, earnings and cash flow cover the fiscal year to date. Cash and debt are
              balances at period end.
            </Notice>
          )}
          {period.metrics.map((metric) => (
            <Card key={metric.key}>
              <Copy style={s.muted}>{metric.label}</Copy>
              <FinancialValue>{money(metric.current?.value)}</FinancialValue>
              {metric.current && (
                <Copy style={s.muted}>
                  {metric.current.start
                    ? `Period ${metric.current.start} to ${metric.current.end}`
                    : `As of ${metric.current.end}`}{' '}
                  · USD
                </Copy>
              )}
              {metric.previous && (
                <View style={{ gap: 6 }}>
                  <Copy style={s.muted}>Prior year · USD</Copy>
                  <FinancialValue>{money(metric.previous.value)}</FinancialValue>
                  <Copy style={s.muted}>
                    {metric.previous.start ? `Period ${metric.previous.start} to ` : 'As of '}
                    {metric.previous.end}
                  </Copy>
                </View>
              )}
              <Copy>{metric.explanation}</Copy>
              {metric.change !== null && <Eyebrow>Change calculated by TickerBrief</Eyebrow>}
              {metric.current && (
                <Button
                  title={`Inspect ${metric.label.toLowerCase()} evidence`}
                  secondary
                  onPress={() =>
                    inspect([...metric.current!.source_ids, ...(metric.previous?.source_ids || [])])
                  }
                />
              )}
            </Card>
          ))}
        </View>
      ))}
      <Card>
        <Eyebrow>Interpretation</Eyebrow>
        <Heading>Summary & competing cases</Heading>
        <Notice>{report.interpretation.message}</Notice>
        {report.interpretation.status === 'available' &&
          content &&
          (['summary', 'bull', 'bear'] as const).map((section) => (
            <View key={section} style={{ gap: 14 }}>
              <Heading>
                {section === 'summary'
                  ? 'Plain-language summary'
                  : section === 'bull'
                    ? 'Bull case'
                    : 'Bear case'}
              </Heading>
              {content[section].map((claim, index) => (
                <View key={index} style={{ gap: 8 }}>
                  <Copy>{claim.text}</Copy>
                  {Boolean(claim.assumption) && (
                    <Copy style={s.muted}>Assumption: {claim.assumption}</Copy>
                  )}
                  <Button
                    title="Inspect supporting evidence"
                    secondary
                    onPress={() => inspect(claim.source_ids)}
                  />
                </View>
              ))}
            </View>
          ))}
      </Card>
      <Card>
        <Eyebrow>Before you draw a conclusion</Eyebrow>
        <Heading>Uncertainties & limits</Heading>
        {report.uncertainties.map((text, index) => (
          <Copy key={index}>• {text}</Copy>
        ))}
      </Card>
      <Card>
        <Heading>Source notebook</Heading>
        <Copy>
          {report.sources.length} retained source records. Financial values include the concept,
          period, filing date and accession; management statements include their original excerpts.
        </Copy>
        <Button
          title="Inspect all sources"
          secondary
          onPress={() => {
            setLinkError(false);
            setSelected(report.sources);
          }}
        />
      </Card>
      <Copy style={s.muted}>
        Research for understanding, not personalized investment advice. Always read the underlying
        filings.
      </Copy>
      {selected.length > 0 && (
        <Modal visible animationType="slide" onRequestClose={() => setSelected([])}>
          <SafeAreaView testID="source-notebook" style={{ flex: 1, backgroundColor: colors.paper }}>
            <View style={{ padding: 18 }}>
              <Button title="Close evidence" onPress={() => setSelected([])} />
            </View>
            <ScrollView contentContainerStyle={s.content}>
              <Eyebrow>Follow the evidence</Eyebrow>
              <Heading>Supporting sources</Heading>
              <Copy style={s.muted}>
                Retained excerpts are available offline. Opening SEC links requires an internet
                connection.
              </Copy>
              {linkError && (
                <Notice error>
                  The source could not be opened. Its retained excerpt is available below; opening
                  SEC links requires a connection.
                </Notice>
              )}
              {selected.map((source) => (
                <Card key={source.id}>
                  <Eyebrow>{source.kind.replaceAll('_', ' ')}</Eyebrow>
                  <Heading>{source.title}</Heading>
                  {Boolean(source.filed) && (
                    <Copy>
                      Filed {dateLabel(source.filed!)} · {source.form}
                    </Copy>
                  )}
                  <Copy style={s.muted}>Retrieved {source.retrieved_at}</Copy>
                  {Boolean(source.accession) && (
                    <Copy selectable style={s.muted}>
                      Accession {source.accession}
                    </Copy>
                  )}
                  {source.value !== null && source.value !== undefined && (
                    <View style={{ gap: 6 }}>
                      <Copy style={s.muted}>Reported value · {source.unit}</Copy>
                      <FinancialValue>{String(source.value)}</FinancialValue>
                      {Boolean(source.end) && (
                        <Copy style={s.muted}>
                          {source.start ? `Period ${source.start} to ` : 'As of '}
                          {source.end}
                        </Copy>
                      )}
                    </View>
                  )}
                  <Copy selectable>{source.excerpt}</Copy>
                  <Button title="Open SEC filing" secondary onPress={() => void open(source.url)} />
                  {source.data_url !== source.url && (
                    <Button
                      title="Open structured SEC data"
                      secondary
                      onPress={() => void open(source.data_url)}
                    />
                  )}
                </Card>
              ))}
            </ScrollView>
          </SafeAreaView>
        </Modal>
      )}
    </>
  );
}
