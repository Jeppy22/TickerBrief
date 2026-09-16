import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { Library } from './schema';
import { LibraryStore } from './storage';

const store = new LibraryStore(AsyncStorage);
type Context = {
  library: Library | null;
  error: string | null;
  reload: () => Promise<void>;
  act: (operation: (store: LibraryStore) => Promise<Library>) => Promise<boolean>;
};
const LibraryContext = createContext<Context | null>(null);
export function LibraryProvider({ children }: PropsWithChildren) {
  const [library, setLibrary] = useState<Library | null>(null);
  const [error, setError] = useState<string | null>(null);
  const reload = useCallback(async () => {
    try {
      setLibrary(await store.read());
      setError(null);
    } catch {
      setError(
        'Your local library could not be read. Your stored data has not been replaced. Try reopening the app.',
      );
    }
  }, []);
  useEffect(() => {
    let mounted = true;
    void store
      .read()
      .then((value) => {
        if (mounted) setLibrary(value);
      })
      .catch(() => {
        if (mounted)
          setError(
            'Your local library could not be read. Your stored data has not been replaced. Try reopening the app.',
          );
      });
    return () => {
      mounted = false;
    };
  }, []);
  const act: Context['act'] = async (operation) => {
    try {
      const next = await operation(store);
      setLibrary(next);
      setError(null);
      return true;
    } catch {
      setError(
        'Changes could not be saved on this device. Please check available storage and try again.',
      );
      return false;
    }
  };
  return (
    <LibraryContext.Provider value={{ library, error, reload, act }}>
      {children}
    </LibraryContext.Provider>
  );
}
export function useLibrary() {
  const context = useContext(LibraryContext);
  if (!context) throw new Error('LibraryProvider missing');
  return context;
}
