import React from 'react';
import {
    CloudOutlined,
    LinuxOutlined,
    WindowsOutlined,
} from '@ant-design/icons';
import type { AdvancedSearchField, SearchField } from '@/components/StandardTable';
import { CMDB_ENV_MAP, CMDB_STATUS_MAP, CMDB_TYPE_MAP } from '@/constants/cmdbDicts';

export const TYPE_MAP = CMDB_TYPE_MAP;
export const STATUS_MAP = CMDB_STATUS_MAP;
export const ENV_MAP = CMDB_ENV_MAP;

export type CMDBSelectableItem = {
    id: string;
    name: string;
    hostname: string;
    ip_address: string;
    status: string;
    os?: string;
    os_version?: string;
    type?: string;
    environment?: string;
};

export type CMDBAdvancedSearch = {
    name?: string;
    name__exact?: string;
    hostname?: string;
    hostname__exact?: string;
    ip_address?: string;
    ip_address__exact?: string;
    type?: AutoHealing.CMDBItemType;
    status?: AutoHealing.CMDBItemStatus | 'online';
    environment?: AutoHealing.CMDBEnvironment;
    source_plugin_name?: string;
    source_plugin_name__exact?: string;
    has_plugin?: boolean | string;
};

export type CMDBRequestParams = {
    page: number;
    pageSize: number;
    searchField?: string;
    searchValue?: string;
    advancedSearch?: CMDBAdvancedSearch;
    sorter?: { field: string; order: 'ascend' | 'descend' };
};

export type CMDBQueryParams = {
    page?: number;
    page_size?: number;
    name?: string;
    name__exact?: string;
    hostname?: string;
    hostname__exact?: string;
    ip_address?: string;
    ip_address__exact?: string;
    type?: AutoHealing.CMDBItemType;
    status?: AutoHealing.CMDBItemStatus;
    environment?: AutoHealing.CMDBEnvironment;
    source_plugin_name?: string;
    source_plugin_name__exact?: string;
    has_plugin?: boolean | string;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
};

export const searchFields: SearchField[] = [
    { key: 'name', label: '关键字' },
    { key: 'ip_search', label: 'IP 地址' },
    { key: 'host_search', label: '主机名' },
];

export const advancedSearchFields: AdvancedSearchField[] = [
    { key: 'name', label: '名称', type: 'input', placeholder: '资产名称' },
    { key: 'ip_address', label: 'IP 地址', type: 'input', placeholder: 'IP 地址' },
    { key: 'hostname', label: '主机名', type: 'input', placeholder: '主机名' },
    {
        key: 'type',
        label: '资产类型',
        type: 'select',
        placeholder: '全部类型',
        options: Object.entries(TYPE_MAP).map(([value, type]) => ({ label: type.text, value })),
    },
    {
        key: 'status',
        label: '资产状态',
        type: 'select',
        placeholder: '全部状态',
        options: Object.entries(STATUS_MAP).map(([value, status]) => ({ label: status.text, value })),
    },
    {
        key: 'environment',
        label: '环境',
        type: 'select',
        placeholder: '全部环境',
        options: Object.entries(ENV_MAP).map(([value, environment]) => ({ label: environment.text, value })),
    },
    { key: 'source_plugin_name', label: '数据来源', type: 'input', placeholder: '插件名称' },
];

export const headerIcon = (
    <svg viewBox="0 0 48 48" fill="none">
        <title>CMDB 资产图标</title>
        <rect x="6" y="8" width="36" height="12" rx="2" stroke="currentColor" strokeWidth="2" fill="none" />
        <rect x="6" y="22" width="36" height="12" rx="2" stroke="currentColor" strokeWidth="2" fill="none" />
        <rect x="6" y="36" width="36" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.5" />
        <circle cx="12" cy="14" r="2" fill="#52c41a" />
        <circle cx="12" cy="28" r="2" fill="#52c41a" />
        <circle cx="12" cy="39" r="1.5" fill="#faad14" />
        <rect x="18" y="13" width="14" height="2" rx="1" fill="currentColor" opacity="0.3" />
        <rect x="18" y="27" width="10" height="2" rx="1" fill="currentColor" opacity="0.3" />
    </svg>
);

export function getOSIcon(os?: string) {
    const normalized = os?.toLowerCase() || '';
    if (
        normalized.includes('linux')
        || normalized.includes('ubuntu')
        || normalized.includes('centos')
        || normalized.includes('rhel')
    ) {
        return <LinuxOutlined style={{ color: '#E95420' }} />;
    }
    if (normalized.includes('windows')) {
        return <WindowsOutlined style={{ color: '#1890ff' }} />;
    }
    return <CloudOutlined style={{ color: '#8c8c8c' }} />;
}

export function normalizeSelectableItem(item: CMDBSelectableItem): CMDBSelectableItem {
    return item.status === 'online'
        ? { ...item, status: 'active' }
        : item;
}
