import * as Crypto from 'expo-crypto';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ReportBody } from '../../components/report';
import { Button, Copy, Eyebrow, Loading, Notice, Screen, Title } from '../../components/ui';
import { getReport } from '../../lib/api';
import { useLibrary } from '../../lib/library';
import { Report } from '../../lib/schema';

export default function ReportScreen() {
  const { ticker } = useLocalSearchParams<{ ticker: string }>();
  return <ResearchView key={ticker} ticker={ticker} />;
}

function ResearchView({ ticker }: { ticker: string }) {
  const [report, setReport] = useState<Report | null>(null);
  const [busy, setBusy] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const { library, error: libraryError, act } = useLibrary();
  const reload = useCallback(() => {
    setBusy(true);
    setError(null);
    setRevision((value) => value + 1);
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    void getReport(ticker, controller.signal)
      .then((value) => {
        if (!controller.signal.aborted) setReport(value);
      })
      .catch((e) => {
        if (!controller.signal.aborted)
          setError(e instanceof Error ? e.message : 'Research unavailable.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setBusy(false);
      });
    return () => controller.abort();
  }, [ticker, revision]);
  const watched = library?.watchlist.some((company) => company.ticker === ticker);
  async function save() {
    if (!report) return;
    setSaving(true);
    const id = Crypto.randomUUID();
    const success = await act((store) => store.save(report, id));
    setSaving(false);
    if (success) router.push({ pathname: '/saved/[id]', params: { id } });
  }
  return (
    <Screen>
      <Eyebrow>{ticker} · SEC research</Eyebrow>
      <Title>{report?.company.name || 'Research brief'}</Title>
      {busy && (
        <Loading
          label={
            report
              ? 'Checking for updated research…'
              : 'Reading SEC filings… This can take a moment.'
          }
          slowHint="The research service is taking longer to respond. Your saved research is available while you wait."
        />
      )}
      {(busy || Boolean(error)) && (
        <Button title="Open saved research" secondary onPress={() => router.replace('/saved')} />
      )}
      {error && (
        <>
          <Notice error>
            {error}
            {report ? ' The previous report remains below.' : ''}
          </Notice>
          <Button title="Retry research" secondary onPress={reload} />
        </>
      )}
      {libraryError && <Notice error>{libraryError}</Notice>}
      {report && (
        <>
          <Button
            title={saving ? 'Saving…' : 'Save report & add notes'}
            onPress={() => void save()}
            disabled={saving || !library}
          />
          <Button
            title={watched ? 'Remove from watchlist' : 'Add to watchlist'}
            secondary
            disabled={!library}
            onPress={() =>
              void act((store) =>
                watched ? store.unwatch(report.company.ticker) : store.watch(report.company),
              )
            }
          />
          <Button title="Refresh research" secondary disabled={busy} onPress={reload} />
          <Copy>
            Saving keeps a dated copy of the report currently shown, even during a refresh.
            Refreshing never changes your saved reports. SEC data is cached to respect source access
            limits.
          </Copy>
          <ReportBody report={report} />
        </>
      )}
    </Screen>
  );
}
