import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { LibraryStore, STORAGE_KEY, StorageAdapter } from '../src/lib/storage';
import { fixtureReport } from './fixtures';

test('saved versions, watchlist and notes survive a new store instance using persisted JSON', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'tickerbrief-test-'));
  const file = join(directory, 'library.json');
  const adapter: StorageAdapter = {
    getItem: async () => {
      try {
        return await readFile(file, 'utf8');
      } catch {
        return null;
      }
    },
    setItem: async (_, value) => {
      await writeFile(file, value);
    },
  };
  try {
    const store = new LibraryStore(adapter);
    await store.watch(fixtureReport.company);
    await store.save(fixtureReport, 'first');
    await store.notes('first', 'Remember to read the filing.');
    const refreshed = structuredClone(fixtureReport);
    refreshed.id = 'newer-test-version';
    refreshed.periods[0].metrics[0].current!.value = 200;
    await store.save(refreshed, 'second');
    const restarted = new LibraryStore(adapter);
    const data = await restarted.read();
    assert.equal(data.watchlist[0].ticker, 'TEST');
    assert.equal(data.saved.length, 2);
    assert.equal(data.saved[1].report.periods[0].metrics[0].current!.value, 100);
    assert.equal(data.saved[1].notes, 'Remember to read the filing.');
    await restarted.delete('second');
    await restarted.unwatch('TEST');
    const reopened = await new LibraryStore(adapter).read();
    assert.equal(reopened.saved.length, 1);
    assert.equal(reopened.saved[0].id, 'first');
    assert.equal(reopened.watchlist.length, 0);
  } finally {
    await rm(directory, { recursive: true });
  }
});

test('simultaneous mutations cannot overwrite each other or duplicate a watch entry', async () => {
  let raw: string | null = null;
  const store = new LibraryStore({
    getItem: async () => raw,
    setItem: async (_, next) => {
      raw = next;
    },
  });
  await Promise.all([
    store.watch(fixtureReport.company),
    store.watch(fixtureReport.company),
    store.save(fixtureReport, 'a'),
    store.save(fixtureReport, 'b'),
  ]);
  assert.equal((await store.read()).watchlist.length, 1);
  assert.equal((await store.read()).saved.length, 2);
});

test('corrupt or future-version data is retained instead of overwritten', async () => {
  for (const invalid of ['{bad json', '{"version":2,"watchlist":[],"saved":[]}']) {
    let raw = invalid;
    const store = new LibraryStore({
      getItem: async (key) => {
        assert.equal(key, STORAGE_KEY);
        return raw;
      },
      setItem: async (_, next) => {
        raw = next;
      },
    });
    await assert.rejects(store.save(fixtureReport, 'a'));
    assert.equal(raw, invalid);
  }
});

test('failed writes are rejected and later writes can recover', async () => {
  let fail = true;
  let raw: string | null = null;
  const store = new LibraryStore({
    getItem: async () => raw,
    setItem: async (_, next) => {
      if (fail) throw new Error('Storage full');
      raw = next;
    },
  });
  await assert.rejects(store.save(fixtureReport, 'a'));
  assert.equal((await store.read()).saved.length, 0);
  fail = false;
  await store.save(fixtureReport, 'b');
  assert.equal((await store.read()).saved[0].id, 'b');
  await assert.rejects(store.save(fixtureReport, 'b'));
});
