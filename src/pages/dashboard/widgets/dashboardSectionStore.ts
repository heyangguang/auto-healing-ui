const DASHBOARD_SECTION_STALE_TIME_MS = 30_000;

export type DashboardSectionSnapshot<T = unknown> = {
  data?: T | null;
  loading: boolean;
};

type DashboardSectionEntry = DashboardSectionSnapshot<unknown> & {
  promise?: Promise<unknown>;
  updatedAt?: number;
};

const EMPTY_SECTION_SNAPSHOT: DashboardSectionSnapshot = Object.freeze({
  data: undefined,
  loading: false,
});

const sectionStore = new Map<string, DashboardSectionEntry>();
const sectionListeners = new Map<string, Set<() => void>>();

function emitSectionChange(key: string) {
  sectionListeners.get(key)?.forEach((listener) => listener());
}

function setSectionEntry(key: string, entry: DashboardSectionEntry) {
  sectionStore.set(key, entry);
  emitSectionChange(key);
}

export function getDashboardSectionSnapshot<T>(key: string) {
  const entry = sectionStore.get(key);
  if (!entry) {
    return EMPTY_SECTION_SNAPSHOT as DashboardSectionSnapshot<T>;
  }
  return entry as DashboardSectionSnapshot<T>;
}

export function subscribeDashboardSection(key: string, listener: () => void) {
  const listeners = sectionListeners.get(key) ?? new Set<() => void>();
  listeners.add(listener);
  sectionListeners.set(key, listeners);

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      sectionListeners.delete(key);
    }
  };
}

export async function fetchDashboardSection<T>(
  key: string,
  loader: () => Promise<T | null>,
  options: { force?: boolean } = {},
) {
  const current = sectionStore.get(key);
  const now = Date.now();

  if (!options.force) {
    if (current?.promise) {
      return current.promise as Promise<T | null>;
    }
    if (current && current.data !== undefined && (current.updatedAt ?? 0) + DASHBOARD_SECTION_STALE_TIME_MS > now) {
      return current.data as T | null;
    }
  }

  const nextEntry: DashboardSectionEntry = {
    ...current,
    loading: true,
  };
  setSectionEntry(key, nextEntry);

  const promise = loader()
    .then((data) => {
      setSectionEntry(key, {
        data,
        loading: false,
        updatedAt: Date.now(),
      });
      return data;
    })
    .catch((error) => {
      setSectionEntry(key, {
        data: current?.data ?? null,
        loading: false,
        updatedAt: Date.now(),
      });
      throw error;
    });

  setSectionEntry(key, {
    ...nextEntry,
    promise,
  });

  return promise;
}

export const __TEST_ONLY__ = {
  clearDashboardSectionStore: () => {
    sectionStore.clear();
    sectionListeners.clear();
  },
};
