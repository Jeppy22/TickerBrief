import { Company, Library, LibrarySchema, Report } from './schema';

export interface StorageAdapter {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
}
export const STORAGE_KEY = 'tickerbrief.library.v1';
const empty = (): Library => ({ version: 1, watchlist: [], saved: [] });

/** Serializes read-modify-write operations; publish success only after durable storage resolves. */
export class LibraryStore {
  private queue: Promise<unknown> = Promise.resolve();
  constructor(private adapter: StorageAdapter) {}
  async read(): Promise<Library> {
    const raw = await this.adapter.getItem(STORAGE_KEY);
    if (raw === null) return empty();
    // Never replace unreadable data with an empty library; callers surface a recovery error.
    return LibrarySchema.parse(JSON.parse(raw));
  }
  private update(change: (library: Library) => void): Promise<Library> {
    const operation = this.queue.then(async () => {
      const library = await this.read();
      change(library);
      const validated = LibrarySchema.parse(library);
      await this.adapter.setItem(STORAGE_KEY, JSON.stringify(validated));
      return validated;
    });
    this.queue = operation.catch(() => undefined);
    return operation;
  }
  watch(company: Company) {
    return this.update((library) => {
      if (!library.watchlist.some((c) => c.ticker === company.ticker))
        library.watchlist.push(company);
    });
  }
  unwatch(ticker: string) {
    return this.update((library) => {
      library.watchlist = library.watchlist.filter((c) => c.ticker !== ticker);
    });
  }
  save(report: Report, id: string, now = new Date().toISOString()) {
    return this.update((library) => {
      if (library.saved.some((s) => s.id === id)) throw new Error('Snapshot ID already exists.');
      library.saved.unshift({
        id,
        savedAt: now,
        report: JSON.parse(JSON.stringify(report)),
        notes: '',
        notesUpdatedAt: null,
      });
    });
  }
  notes(id: string, notes: string) {
    return this.update((library) => {
      const saved = library.saved.find((s) => s.id === id);
      if (!saved) throw new Error('Saved report no longer exists.');
      if (notes.length > 20000) throw new Error('Notes must be fewer than 20,000 characters.');
      saved.notes = notes;
      saved.notesUpdatedAt = new Date().toISOString();
    });
  }
  delete(id: string) {
    return this.update((library) => {
      library.saved = library.saved.filter((s) => s.id !== id);
    });
  }
}
