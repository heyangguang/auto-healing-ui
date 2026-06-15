import type { EnvironmentStatsShape } from './types';

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object') return null;
  return value as Record<string, unknown>;
}

function getNumberField(
  source: Record<string, unknown>,
  key: string,
): number | null {
  const value = source[key];
  return typeof value === 'number' ? value : null;
}

export function createPlaceholderItem(ip: string): AutoHealing.CMDBItem {
  return {
    id: ip as unknown as AutoHealing.UUID,
    ip_address: ip,
    hostname: ip,
  } as unknown as AutoHealing.CMDBItem;
}

export function normalizeHostIdentity(value?: string | null): string {
  return (value || '').trim().toLowerCase();
}

export function getHostSelectionValue(host: AutoHealing.CMDBItem): string {
  return (
    host.hostname ||
    host.ip_address ||
    host.name ||
    String(host.id || '')
  ).trim();
}

export function getHostIdentityValues(host: AutoHealing.CMDBItem): string[] {
  return Array.from(
    new Set(
      [
        normalizeHostIdentity(host.ip_address),
        normalizeHostIdentity(host.hostname),
        normalizeHostIdentity(host.name),
        normalizeHostIdentity(String(host.id || '')),
      ].filter(Boolean),
    ),
  );
}

export function hostMatchesValue(
  host: AutoHealing.CMDBItem,
  value?: string | null,
): boolean {
  const identity = normalizeHostIdentity(value);
  if (!identity) return false;
  return getHostIdentityValues(host).includes(identity);
}

export function isHostSelected(
  host: AutoHealing.CMDBItem,
  selectedHosts: string[] = [],
): boolean {
  return selectedHosts.some((value) => hostMatchesValue(host, value));
}

export function isHostExcluded(
  host: AutoHealing.CMDBItem,
  excludeHosts: string[] = [],
): boolean {
  if (excludeHosts.length === 0) return false;
  const excluded = new Set(
    excludeHosts.map(normalizeHostIdentity).filter(Boolean),
  );
  return getHostIdentityValues(host).some((identity) => excluded.has(identity));
}

export function normalizeSelectedHostValues(
  values: string[],
  knownHosts: AutoHealing.CMDBItem[] = [],
): string[] {
  const result: string[] = [];
  const seen = new Set<string>();

  values.forEach((rawValue) => {
    const trimmed = rawValue.trim();
    if (!trimmed) return;
    const knownHost = knownHosts.find((host) =>
      hostMatchesValue(host, trimmed),
    );
    const identities = knownHost
      ? getHostIdentityValues(knownHost)
      : [normalizeHostIdentity(trimmed)];
    if (identities.some((identity) => seen.has(identity))) return;

    result.push(knownHost ? getHostSelectionValue(knownHost) : trimmed);
    identities.forEach((identity) => {
      seen.add(identity);
    });
  });

  return result;
}

export function getTotalFromListResponse(response: unknown): number {
  const asObj = asRecord(response);
  if (!asObj) return 0;
  return getNumberField(asObj, 'total') ?? getNumberField(asObj, 'count') ?? 0;
}

export function normalizeStatsResponse(
  response: unknown,
): EnvironmentStatsShape {
  const asObj = asRecord(response);
  if (!asObj) return { total: 0, by_environment: [] };
  const dataField = asRecord(asObj.data);
  const source = dataField || asObj;

  const total = getNumberField(source, 'total') ?? 0;
  const rawByEnv = Array.isArray(source.by_environment)
    ? source.by_environment
    : [];
  const byEnvironment: NonNullable<EnvironmentStatsShape['by_environment']> =
    [];
  rawByEnv.forEach((item) => {
    const row = asRecord(item);
    if (!row) return;
    const environment =
      typeof row.environment === 'string' ? row.environment : undefined;
    const count = getNumberField(row, 'count') ?? 0;
    byEnvironment.push({ environment, count });
  });

  return { total, by_environment: byEnvironment };
}
