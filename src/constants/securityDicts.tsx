import { getDictItems, onDictRefresh } from '@/utils/dictCache';

type BadgeStatus = 'success' | 'error' | 'warning' | 'processing' | 'default';

export interface SecurityDictMeta {
    label: string;
    color: string;
    tagColor: string;
    badge: BadgeStatus;
    desc?: string;
}

const DEFAULT_META: SecurityDictMeta = {
    label: '未知',
    color: '#8c8c8c',
    tagColor: 'default',
    badge: 'default',
};

export let COMMAND_BLACKLIST_SEVERITY_META: Record<string, SecurityDictMeta> = {};
export let COMMAND_BLACKLIST_MATCH_TYPE_META: Record<string, SecurityDictMeta> = {};
export let COMMAND_BLACKLIST_CATEGORY_META: Record<string, SecurityDictMeta> = {};
export let BLACKLIST_EXEMPTION_STATUS_META: Record<string, SecurityDictMeta> = {};

const toMetaMap = (dictType: string): Record<string, SecurityDictMeta> => {
    const items = getDictItems(dictType);
    if (!items?.length) {
        return {};
    }
    return Object.fromEntries(items.map(item => [item.dict_key, {
        label: item.label || item.dict_key,
        color: item.color || '#8c8c8c',
        tagColor: item.tag_color || 'default',
        badge: (item.badge || 'default') as BadgeStatus,
        desc: typeof item.extra?.description === 'string' ? item.extra.description : undefined,
    }]));
};

const toOptions = (map: Record<string, SecurityDictMeta>) =>
    Object.entries(map).map(([value, meta]) => ({ label: meta.label, value }));

const fallbackMeta = (key: string): SecurityDictMeta => ({
    ...DEFAULT_META,
    label: key || DEFAULT_META.label,
});

export const getBlacklistSeverityMeta = (key: string): SecurityDictMeta =>
    COMMAND_BLACKLIST_SEVERITY_META[key] || fallbackMeta(key);

export const getBlacklistMatchTypeMeta = (key: string): SecurityDictMeta =>
    COMMAND_BLACKLIST_MATCH_TYPE_META[key] || fallbackMeta(key);

export const getBlacklistCategoryMeta = (key: string): SecurityDictMeta =>
    COMMAND_BLACKLIST_CATEGORY_META[key] || fallbackMeta(key);

export const getBlacklistExemptionStatusMeta = (key: string): SecurityDictMeta =>
    BLACKLIST_EXEMPTION_STATUS_META[key] || fallbackMeta(key);

export const getBlacklistSeverityOptions = () => toOptions(COMMAND_BLACKLIST_SEVERITY_META);
export const getBlacklistMatchTypeOptions = () => toOptions(COMMAND_BLACKLIST_MATCH_TYPE_META);
export const getBlacklistCategoryOptions = () => toOptions(COMMAND_BLACKLIST_CATEGORY_META);
export const getBlacklistExemptionStatusOptions = () => toOptions(BLACKLIST_EXEMPTION_STATUS_META);

function refresh() {
    COMMAND_BLACKLIST_SEVERITY_META = toMetaMap('command_blacklist_severity');
    COMMAND_BLACKLIST_MATCH_TYPE_META = toMetaMap('command_blacklist_match_type');
    COMMAND_BLACKLIST_CATEGORY_META = toMetaMap('command_blacklist_category');
    BLACKLIST_EXEMPTION_STATUS_META = toMetaMap('blacklist_exemption_status');
}

onDictRefresh(refresh);
refresh();
