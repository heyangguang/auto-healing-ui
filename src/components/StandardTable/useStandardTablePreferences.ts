import { useCallback, useEffect, useRef, useState } from 'react';
import { getPreferences, patchPreferences } from '@/services/auto-healing/preferences';
import type { ColumnSettingItem } from './ColumnSettingsModal';

interface PreferenceColumnDef {
  columnKey: string;
  columnTitle: string;
  fixedColumn?: boolean;
  defaultVisible?: boolean;
}

type ColumnWidths = Record<string, number>;
type ColumnWidthsUpdater = ColumnWidths | ((prev: ColumnWidths) => ColumnWidths);

let prefsCachePromise: Promise<any> | null = null;
let prefsCacheResult: any = null;
let prefsCacheTime = 0;
const PREFS_CACHE_TTL = 10_000;

const getCachedPreferences = async () => {
  const now = Date.now();
  if (prefsCacheResult && now - prefsCacheTime < PREFS_CACHE_TTL) {
    return prefsCacheResult;
  }
  if (prefsCachePromise) {
    return prefsCachePromise;
  }
  prefsCachePromise = getPreferences()
    .then((response) => {
      prefsCacheResult = response;
      prefsCacheTime = Date.now();
      return response;
    })
    .finally(() => {
      prefsCachePromise = null;
    });
  return prefsCachePromise;
};

const toInitialColumnSettings = (columnDefs?: PreferenceColumnDef[]) =>
  (columnDefs || []).map((column) => ({
    key: column.columnKey,
    title: column.columnTitle,
    fixed: column.fixedColumn ?? false,
    visible: column.defaultVisible !== false,
  }));

export function useStandardTablePreferences(
  columnDefs: PreferenceColumnDef[] | undefined,
  preferenceKey?: string,
) {
  const [columnWidths, setColumnWidths] = useState<ColumnWidths>({});
  const [columnSettings, setColumnSettings] = useState<ColumnSettingItem[]>(() =>
    toInitialColumnSettings(columnDefs),
  );
  const [prefsLoaded, setPrefsLoaded] = useState(!preferenceKey);
  const saveTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const schedulePreferenceSave = useCallback((key: string, value: any) => {
    if (!preferenceKey) {
      return;
    }
    const timers = saveTimersRef.current;
    const existing = timers.get(key);
    if (existing) {
      clearTimeout(existing);
    }
    timers.set(
      key,
      setTimeout(() => {
        timers.delete(key);
        patchPreferences({ [key]: value })
          .then(() => {
            prefsCacheResult = null;
          })
          .catch(() => {});
      }, 500),
    );
  }, [preferenceKey]);

  useEffect(() => {
    if (!preferenceKey) {
      setPrefsLoaded(true);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const response = await getCachedPreferences();
        if (cancelled) {
          return;
        }
        const preferences = response?.preferences ?? {};
        const savedWidths = preferences[`${preferenceKey}_column_widths`];
        if (savedWidths && typeof savedWidths === 'object') {
          setColumnWidths(savedWidths);
        }
        const savedColumns = preferences[`${preferenceKey}_columns`] as string[] | undefined;
        if (Array.isArray(savedColumns) && savedColumns.length > 0) {
          setColumnSettings((previous) => {
            const entries = new Map(previous.map((item) => [item.key, item]));
            const next: ColumnSettingItem[] = [];
            for (const key of savedColumns) {
              const item = entries.get(key);
              if (item) {
                next.push({ ...item, visible: true });
                entries.delete(key);
              }
            }
            for (const item of entries.values()) {
              next.push({ ...item, visible: item.fixed ? true : false });
            }
            return next;
          });
        }
      } catch {
        // Ignore initial preference load failures and fall back to defaults.
      }
      if (!cancelled) {
        setPrefsLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [preferenceKey]);

  useEffect(() => {
    return () => {
      const timers = saveTimersRef.current;
      for (const handle of timers.values()) {
        clearTimeout(handle);
      }
      timers.clear();
    };
  }, []);

  const updateColumnWidths = useCallback((updater: ColumnWidthsUpdater) => {
    setColumnWidths((previous) => {
      const next = typeof updater === 'function' ? updater(previous) : updater;
      if (preferenceKey) {
        schedulePreferenceSave(`${preferenceKey}_column_widths`, next);
      }
      return next;
    });
  }, [preferenceKey, schedulePreferenceSave]);

  const applyColumnSettings = useCallback((nextSettings: ColumnSettingItem[]) => {
    setColumnSettings(nextSettings);
    if (preferenceKey) {
      const visibleKeys = nextSettings.filter((item) => item.visible).map((item) => item.key);
      schedulePreferenceSave(`${preferenceKey}_columns`, visibleKeys);
    }
  }, [preferenceKey, schedulePreferenceSave]);

  return {
    prefsLoaded,
    columnWidths,
    columnSettings,
    updateColumnWidths,
    applyColumnSettings,
  };
}
