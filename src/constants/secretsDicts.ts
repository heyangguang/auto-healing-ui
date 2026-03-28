import { getDictItems, onDictRefresh } from '@/utils/dictCache';

type BadgeStatus = 'success' | 'error' | 'warning' | 'processing' | 'default';

export interface SecretsDictMeta {
  label: string;
  color: string;
  tagColor: string;
  badge: BadgeStatus;
}

const DEFAULT_META: SecretsDictMeta = {
  label: '未知',
  color: '#8c8c8c',
  tagColor: 'default',
  badge: 'default',
};

const FB_SOURCE_META: Record<string, SecretsDictMeta> = {
  file: { label: '本地文件', color: '#1890ff', tagColor: 'processing', badge: 'processing' },
  vault: { label: 'Vault', color: '#722ed1', tagColor: 'purple', badge: 'processing' },
  webhook: { label: 'Webhook', color: '#52c41a', tagColor: 'success', badge: 'success' },
};

const FB_AUTH_META: Record<string, SecretsDictMeta> = {
  ssh_key: { label: 'SSH 密钥', color: '#1890ff', tagColor: 'processing', badge: 'processing' },
  password: { label: '密码认证', color: '#fa8c16', tagColor: 'warning', badge: 'warning' },
};

const FB_STATUS_META: Record<string, SecretsDictMeta> = {
  active: { label: '已启用', color: '#52c41a', tagColor: 'success', badge: 'success' },
  inactive: { label: '已禁用', color: '#8c8c8c', tagColor: 'default', badge: 'default' },
};

export let SECRETS_SOURCE_META: Record<string, SecretsDictMeta> = { ...FB_SOURCE_META };
export let SECRETS_AUTH_META: Record<string, SecretsDictMeta> = { ...FB_AUTH_META };
export let SECRETS_STATUS_META: Record<string, SecretsDictMeta> = { ...FB_STATUS_META };

export let SECRETS_SOURCE_OPTIONS = toOptions(SECRETS_SOURCE_META);
export let CREDENTIAL_TYPE_OPTIONS = toOptions(SECRETS_AUTH_META);
export let SECRETS_STATUS_OPTIONS = toOptions(SECRETS_STATUS_META);

function toMeta(item: { label: string; color?: string; tag_color?: string; badge?: string }) {
  return {
    label: item.label,
    color: item.color || DEFAULT_META.color,
    tagColor: item.tag_color || item.color || DEFAULT_META.tagColor,
    badge: (item.badge || DEFAULT_META.badge) as BadgeStatus,
  };
}

function toOptions(map: Record<string, SecretsDictMeta>) {
  return Object.entries(map).map(([value, meta]) => ({ label: meta.label, value }));
}

function fallbackMeta(key?: string) {
  return {
    ...DEFAULT_META,
    label: key || DEFAULT_META.label,
  };
}

function refreshSourceTypes() {
  const items = getDictItems('secrets_source_type');
  SECRETS_SOURCE_META = items?.length
    ? { ...FB_SOURCE_META, ...Object.fromEntries(items.map(item => [item.dict_key, toMeta(item)])) }
    : { ...FB_SOURCE_META };
  SECRETS_SOURCE_OPTIONS = toOptions(SECRETS_SOURCE_META);
}

function refreshAuthTypes() {
  const items = getDictItems('secrets_auth_type');
  SECRETS_AUTH_META = items?.length
    ? { ...FB_AUTH_META, ...Object.fromEntries(items.map(item => [item.dict_key, toMeta(item)])) }
    : { ...FB_AUTH_META };
  CREDENTIAL_TYPE_OPTIONS = toOptions(SECRETS_AUTH_META);
}

function refreshStatuses() {
  const items = getDictItems('secrets_source_status');
  SECRETS_STATUS_META = items?.length
    ? { ...FB_STATUS_META, ...Object.fromEntries(items.map(item => [item.dict_key, toMeta(item)])) }
    : { ...FB_STATUS_META };
  SECRETS_STATUS_OPTIONS = toOptions(SECRETS_STATUS_META);
}

function refresh() {
  refreshSourceTypes();
  refreshAuthTypes();
  refreshStatuses();
}

export function getSecretsSourceTypeMeta(type?: string): SecretsDictMeta {
  if (!type) {
    return fallbackMeta();
  }
  return SECRETS_SOURCE_META[type] || fallbackMeta(type);
}

export function getSecretsAuthTypeMeta(type?: string): SecretsDictMeta {
  if (!type) {
    return fallbackMeta();
  }
  return SECRETS_AUTH_META[type] || fallbackMeta(type);
}

export function getSecretsSourceStatusMeta(status?: string): SecretsDictMeta {
  if (!status) {
    return fallbackMeta();
  }
  return SECRETS_STATUS_META[status] || fallbackMeta(status);
}

onDictRefresh(refresh);
refresh();
