import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ReportBody } from '../../components/report';
import {
  Button,
  Card,
  Copy,
  dateLabel,
  Eyebrow,
  Heading,
  Input,
  Loading,
  Notice,
  Screen,
  Title,
} from '../../components/ui';
import { useLibrary } from '../../lib/library';

export default function SavedDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { library, error, act } = useLibrary();
  const saved = library?.saved.find((item) => item.id === id);
  const [draft, setDraft] = useState<{ id: string; text: string } | null>(null);
  const notes = draft?.id === id ? draft.text : saved?.notes || '';
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [message, setMessage] = useState('');
  async function saveNotes() {
    setBusy(true);
    const success = await act((store) => store.notes(id, notes));
    setBusy(false);
    if (success) setMessage('Notes saved on this device.');
  }
  async function remove() {
    setBusy(true);
    const success = await act((store) => store.delete(id));
    setBusy(false);
    if (success) router.replace('/saved');
  }
  return (
    <Screen>
      {error && <Notice error>{error}</Notice>}
      {!library && !error && <Loading label="Opening your saved report…" />}
      {library && !saved && (
        <>
          <Title>Report not found</Title>
          <Copy>This saved version may have been deleted from this device.</Copy>
          <Button title="Back to saved research" onPress={() => router.replace('/saved')} />
        </>
      )}
      {saved && (
        <>
          <Eyebrow>{saved.report.company.ticker} · Saved snapshot</Eyebrow>
          <Title>{saved.report.company.name}</Title>
          <Notice>
            Saved {dateLabel(saved.savedAt)} at {new Date(saved.savedAt).toLocaleTimeString()}. This
            version is available offline and will not change when live research refreshes.
          </Notice>
          <Card>
            <Heading>Your notes</Heading>
            <Copy>
              Private to this device. These notes are yours, not part of the research report.
            </Copy>
            <Input
              accessibilityLabel="Personal research notes"
              multiline
              value={notes}
              onChangeText={(value) => {
                setDraft({ id, text: value });
                setMessage('');
              }}
              placeholder="What matters to your research?"
              style={{ minHeight: 150, textAlignVertical: 'top' }}
              maxLength={20000}
            />
            {notes !== saved.notes && (
              <Copy>Unsaved changes — save before leaving this screen.</Copy>
            )}
            <Button
              title={busy ? 'Saving…' : 'Save notes'}
              disabled={busy || notes === saved.notes}
              onPress={() => void saveNotes()}
            />
            {Boolean(message) && <Notice tone="success">{message}</Notice>}
          </Card>
          <Button
            title="Open current research"
            secondary
            onPress={() =>
              router.push({
                pathname: '/report/[ticker]',
                params: { ticker: saved.report.company.ticker },
              })
            }
          />
          <ReportBody report={saved.report} />
          {confirmDelete ? (
            <Card>
              <Heading>Delete this saved version?</Heading>
              <Copy>
                Its notes will also be removed from this device. Other saved versions will stay.
              </Copy>
              <Button
                title="Delete report and notes"
                danger
                secondary
                disabled={busy}
                onPress={() => void remove()}
              />
              <Button title="Keep this report" secondary onPress={() => setConfirmDelete(false)} />
            </Card>
          ) : (
            <Button
              title="Delete saved report"
              danger
              secondary
              onPress={() => setConfirmDelete(true)}
            />
          )}
        </>
      )}
    </Screen>
  );
}
