import { router } from 'expo-router';
import {
  Button,
  Card,
  Copy,
  dateLabel,
  Eyebrow,
  Heading,
  Loading,
  Notice,
  Screen,
  Title,
} from '../../components/ui';
import { useLibrary } from '../../lib/library';

export default function SavedScreen() {
  const { library, error } = useLibrary();
  return (
    <Screen>
      <Eyebrow>Available offline</Eyebrow>
      <Title>Saved research</Title>
      <Copy>Your dated report versions and personal notes, kept on this device.</Copy>
      {error && <Notice error>{error}</Notice>}
      {!library && !error && <Loading label="Opening saved research…" />}
      {library?.saved.length === 0 && (
        <Card>
          <Heading>Build your research notebook.</Heading>
          <Copy>
            Save a brief to keep its facts and source excerpts. You can add notes and return to it
            without a connection.
          </Copy>
          <Button title="Find your first company" onPress={() => router.navigate('/')} />
        </Card>
      )}
      {library?.saved.map((saved) => (
        <Card key={saved.id}>
          <Eyebrow>
            {saved.report.company.ticker} · Saved {dateLabel(saved.savedAt)}
          </Eyebrow>
          <Heading>{saved.report.company.name}</Heading>
          <Copy>Data retrieved {dateLabel(saved.report.retrieved_at)}</Copy>
          {Boolean(saved.notes) && <Copy numberOfLines={2}>{saved.notes}</Copy>}
          <Button
            title="Open saved report"
            secondary
            onPress={() => router.push({ pathname: '/saved/[id]', params: { id: saved.id } })}
          />
        </Card>
      ))}
    </Screen>
  );
}
