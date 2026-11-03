import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
// Adjust to wherever your AuthContext lives / what it exposes.
import { useAuth } from '../auth/AuthContext';
import { storesApi } from '../api/storesApi';
import { getStoredStoreId, setStoredStoreId } from './storeSelection';
import type { Store } from './types';

interface StoreContextValue {
  stores: Store[];
  /** Store the app is scoped to. null = "All stores" (owner only). */
  activeStore: Store | null;
  /** Only an owner with more than one store can switch. */
  canSwitch: boolean;
  loading: boolean;
  error: string | null;
  selectStore: (id: number | null) => void;
  reload: () => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const ready = !!user && !user.isFirstLogin; // no store list until setup is done
  const isOwner = user?.role === 'Owner';

  const [stores, setStores] = useState<Store[]>([]);
  const [activeId, setActiveId] = useState<number | null>(getStoredStoreId);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!ready) {
      setStores([]);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    storesApi
      .list()
      .then((list) => {
        if (cancelled) return;
        setStores(list);

        if (!isOwner) {
          setStoredStoreId(null);
          setActiveId(null);
        } else if (list.length === 1) {
          setStoredStoreId(list[0].id);
          setActiveId(list[0].id);
        } else {
          const stored = getStoredStoreId();
          if (stored !== null && !list.some((s) => s.id === stored)) {
            setStoredStoreId(null); 
            setActiveId(null);
          }
        }
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [ready, isOwner, reloadKey]);

  const selectStore = useCallback(
    (id: number | null) => {
      if (!isOwner) return;
      setStoredStoreId(id);
      setActiveId(id);
    },
    [isOwner],
  );

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  const value = useMemo<StoreContextValue>(() => {
    const activeStore = isOwner
      ? (stores.find((s) => s.id === activeId) ?? null)
      : (stores[0] ?? null);

    return {
      stores,
      activeStore,
      canSwitch: isOwner && stores.length > 1,
      loading,
      error,
      selectStore,
      reload,
    };
  }, [stores, activeId, isOwner, loading, error, selectStore, reload]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStores(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStores must be used inside <StoreProvider>');
  return ctx;
}