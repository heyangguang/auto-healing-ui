import { getExecutionTasks } from '@/services/auto-healing/execution';
import { getGitRepos } from '@/services/auto-healing/git-repos';
import { getChannels, getTemplates } from '@/services/auto-healing/notification';
import { getPlaybooks } from '@/services/auto-healing/playbooks';
import { fetchAllPages } from './fetchAllPages';
import { getTenantContextScopeKey } from './tenantContext';

type CacheEntry<T> = {
  value?: T;
  promise?: Promise<T>;
  expiresAt?: number;
};

type CacheOptions = {
  forceRefresh?: boolean;
  ttlMs?: number;
};

const DEFAULT_TTL_MS = 60_000;

export const selectorInventoryKeys = {
  gitRepos: 'git-repos:all',
  playbooks: 'playbooks:all',
  executionTasks: 'execution-tasks:all',
  notificationChannels: 'notification-channels:all',
  notificationTemplates: 'notification-templates:all',
} as const;

type SelectorInventoryKey =
  typeof selectorInventoryKeys[keyof typeof selectorInventoryKeys];

const cache = new Map<string, CacheEntry<unknown>>();
let currentScopeKey = 'anonymous:platform';

function resolveScopedCacheKey(key: SelectorInventoryKey) {
  const nextScopeKey = getTenantContextScopeKey();
  if (nextScopeKey !== currentScopeKey) {
    cache.clear();
    currentScopeKey = nextScopeKey;
  }
  return `${nextScopeKey}:${key}`;
}

async function getCachedInventory<T>(
  key: SelectorInventoryKey,
  loader: () => Promise<T>,
  options?: CacheOptions,
): Promise<T> {
  const scopedKey = resolveScopedCacheKey(key);
  const ttlMs = options?.ttlMs ?? DEFAULT_TTL_MS;
  const now = Date.now();
  const existing = cache.get(scopedKey) as CacheEntry<T> | undefined;

  if (!options?.forceRefresh) {
    if (existing?.value !== undefined && (existing.expiresAt ?? 0) > now) {
      return existing.value;
    }
    if (existing?.promise) {
      return existing.promise;
    }
  }

  const promise = loader()
    .then((value) => {
      cache.set(scopedKey, {
        value,
        expiresAt: Date.now() + ttlMs,
      });
      return value;
    })
    .catch((error) => {
      const current = cache.get(scopedKey) as CacheEntry<T> | undefined;
      if (current?.promise === promise) {
        cache.delete(scopedKey);
      }
      throw error;
    });

  cache.set(scopedKey, { promise });
  return promise;
}

export function clearSelectorInventoryCache() {
  cache.clear();
  currentScopeKey = 'anonymous:platform';
}

export function invalidateSelectorInventory(key: SelectorInventoryKey) {
  cache.delete(resolveScopedCacheKey(key));
}

export function getCachedGitRepoInventory(options?: CacheOptions) {
  return getCachedInventory(
    selectorInventoryKeys.gitRepos,
    () => fetchAllPages<AutoHealing.GitRepository>(
      (page, pageSize) => getGitRepos({ page, page_size: pageSize }),
    ),
    options,
  );
}

export function getCachedPlaybookInventory(options?: CacheOptions) {
  return getCachedInventory(
    selectorInventoryKeys.playbooks,
    () => fetchAllPages<AutoHealing.Playbook>(
      (page, pageSize) => getPlaybooks({ page, page_size: pageSize }),
    ),
    options,
  );
}

export function getCachedExecutionTaskInventory(options?: CacheOptions) {
  return getCachedInventory(
    selectorInventoryKeys.executionTasks,
    () => fetchAllPages<AutoHealing.ExecutionTask>(
      (page, pageSize) => getExecutionTasks({ page, page_size: pageSize }),
    ),
    options,
  );
}

export function getCachedNotificationChannelInventory(options?: CacheOptions) {
  return getCachedInventory(
    selectorInventoryKeys.notificationChannels,
    () => fetchAllPages<AutoHealing.NotificationChannel>(
      (page, pageSize) => getChannels({ page, page_size: pageSize }),
    ),
    options,
  );
}

export function getCachedNotificationTemplateInventory(options?: CacheOptions) {
  return getCachedInventory(
    selectorInventoryKeys.notificationTemplates,
    () => fetchAllPages<AutoHealing.NotificationTemplate>(
      (page, pageSize) => getTemplates({ page, page_size: pageSize }),
    ),
    options,
  );
}
