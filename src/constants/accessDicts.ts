import { getDictItems, onDictRefresh } from '@/utils/dictCache';

type BadgeStatus = 'success' | 'error' | 'warning' | 'processing' | 'default';

export interface AccessDictMeta {
  label: string;
  color: string;
  tagColor: string;
  badge: BadgeStatus;
}

const DEFAULT_META: AccessDictMeta = {
  label: '未知',
  color: '#8c8c8c',
  tagColor: 'default',
  badge: 'default',
};

const FB_IMPERSONATION_STATUS: Record<string, AccessDictMeta> = {
  pending: { label: '待审批', color: '#fa8c16', tagColor: 'processing', badge: 'processing' },
  approved: { label: '已批准', color: '#13c2c2', tagColor: 'cyan', badge: 'success' },
  rejected: { label: '已拒绝', color: '#ff4d4f', tagColor: 'error', badge: 'error' },
  active: { label: '会话中', color: '#52c41a', tagColor: 'success', badge: 'success' },
  completed: { label: '已完成', color: '#8c8c8c', tagColor: 'default', badge: 'default' },
  expired: { label: '已过期', color: '#faad14', tagColor: 'warning', badge: 'warning' },
  cancelled: { label: '已撤销', color: '#8c8c8c', tagColor: 'default', badge: 'default' },
};

export let IMPERSONATION_STATUS_META: Record<string, AccessDictMeta> = { ...FB_IMPERSONATION_STATUS };
export let IMPERSONATION_STATUS_OPTIONS = toOptions(IMPERSONATION_STATUS_META);

function toOptions(map: Record<string, AccessDictMeta>) {
  return Object.entries(map).map(([value, meta]) => ({ label: meta.label, value }));
}

function toMeta(item: { label: string; color?: string; tag_color?: string; badge?: string }) {
  return {
    label: item.label,
    color: item.color || DEFAULT_META.color,
    tagColor: item.tag_color || item.color || DEFAULT_META.tagColor,
    badge: (item.badge || DEFAULT_META.badge) as BadgeStatus,
  };
}

function refresh() {
  const items = getDictItems('impersonation_status');
  IMPERSONATION_STATUS_META = items?.length
    ? { ...FB_IMPERSONATION_STATUS, ...Object.fromEntries(items.map(item => [item.dict_key, toMeta(item)])) }
    : { ...FB_IMPERSONATION_STATUS };
  IMPERSONATION_STATUS_OPTIONS = toOptions(IMPERSONATION_STATUS_META);
}

export function getImpersonationStatusMeta(status?: string) {
  if (!status) {
    return DEFAULT_META;
  }
  return IMPERSONATION_STATUS_META[status] || { ...DEFAULT_META, label: status };
}

onDictRefresh(refresh);
refresh();
