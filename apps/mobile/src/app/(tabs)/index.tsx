import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import {
  Button,
  Card,
  colors,
  Copy,
  Eyebrow,
  Heading,
  Input,
  Loading,
  Notice,
  s,
  Screen,
  Section,
  Title,
} from '../../components/ui';
import { searchCompanies } from '../../lib/api';
import { Company } from '../../lib/schema';

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Company[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stale, setStale] = useState(false);
  const active = useRef<AbortController | null>(null);
  useEffect(() => () => active.current?.abort(), []);
  async function search(value = query) {
    if (!value.trim()) return;
    active.current?.abort();
    const controller = new AbortController();
    active.current = controller;
    setBusy(true);
    setError(null);
    setResults(null);
    try {
      const response = await searchCompanies(value.trim(), controller.signal);
      if (!controller.signal.aborted) {
        setResults(response.companies);
        setStale(response.stale);
      }
    } catch (e) {
      if (!controller.signal.aborted)
        setError(e instanceof Error ? e.message : 'Research is unavailable.');
    } finally {
      if (!controller.signal.aborted) setBusy(false);
    }
  }
  return (
    <Screen>
      <View style={s.row}>
        <Eyebrow>TickerBrief</Eyebrow>
        <Copy style={s.muted}>PRIVATE BETA</Copy>
      </View>
      <Title>Research a company</Title>
      <Copy style={{ color: colors.textSecondary }}>
        Understand the business. Read the numbers. Check the evidence.
      </Copy>
      <Input
        accessibilityLabel="Company name or ticker"
        placeholder="Company name or ticker"
        value={query}
        onChangeText={setQuery}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        onSubmitEditing={() => void search()}
        maxLength={80}
      />
      <Button
        title="Search companies"
        onPress={() => void search()}
        disabled={busy || !query.trim()}
      />
      {busy && (
        <Loading
          label="Searching SEC companies…"
          slowHint="The research service is taking longer to respond. Your saved research is available while you wait."
        />
      )}
      {error && (
        <>
          <Notice error>{error}</Notice>
          <Button title="Try search again" secondary onPress={() => void search()} />
        </>
      )}
      {(busy || Boolean(error)) && (
        <Button title="Open saved research" secondary onPress={() => router.navigate('/saved')} />
      )}
      {stale && results && <Notice>The company directory is cached and may be out of date.</Notice>}
      {results?.length === 0 && (
        <Card>
          <Heading>No matching company</Heading>
          <Copy>
            Try the full company name or its US ticker. Funds, private companies and foreign
            reporting formats may not be supported.
          </Copy>
        </Card>
      )}
      {results?.map((company) => (
        <Card key={company.ticker}>
          <View style={s.row}>
            <Eyebrow>{company.ticker}</Eyebrow>
            <Copy style={s.muted}>SEC filing coverage</Copy>
          </View>
          <Heading>{company.name}</Heading>
          <Button
            title={`Read ${company.ticker} brief`}
            secondary
            onPress={() =>
              router.push({ pathname: '/report/[ticker]', params: { ticker: company.ticker } })
            }
          />
        </Card>
      ))}
      {results === null && !busy && !error && (
        <>
          <Section>
            <Eyebrow>Start with a company</Eyebrow>
            <Heading>Research begins at the source.</Heading>
            <Copy>
              Search US public companies for financial results drawn from SEC filings. Every
              available figure links back to its evidence.
            </Copy>
            <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
              {['AAPL', 'MSFT', 'RKLB'].map((ticker) => (
                <Button
                  key={ticker}
                  title={ticker}
                  secondary
                  onPress={() => {
                    setQuery(ticker);
                    void search(ticker);
                  }}
                />
              ))}
            </View>
          </Section>
          <Copy style={s.muted}>
            These are search shortcuts, not recommendations. No accounts, price predictions or
            trading signals.
          </Copy>
        </>
      )}
      <Copy style={s.muted}>
        Initial coverage: US-GAAP companies filing a 10-K with USD financial data. Some search
        matches cannot yet be analyzed.
      </Copy>
    </Screen>
  );
}
