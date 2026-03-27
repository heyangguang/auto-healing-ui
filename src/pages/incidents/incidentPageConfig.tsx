import React from 'react';
import type { AdvancedSearchField, SearchField } from '@/components/StandardTable';
import {
  getHealingStatusOptions,
  getIncidentStatusOptions,
  getSeverityOptions,
} from '@/constants/incidentDicts';

export type IncidentAdvancedSearch = {
  title?: string;
  title__exact?: string;
  external_id?: string;
  external_id__exact?: string;
  source_plugin_name?: string;
  source_plugin_name__exact?: string;
  severity?: AutoHealing.IncidentSeverity;
  healing_status?: AutoHealing.HealingStatus;
  status?: AutoHealing.IncidentStatus;
  scanned?: boolean | 'true' | 'false';
  has_plugin?: 'true' | 'false';
};

export type IncidentSort = {
  field: string;
  order: 'ascend' | 'descend';
};

export type IncidentRequestParams = {
  page: number;
  pageSize: number;
  searchField?: string;
  searchValue?: string;
  advancedSearch?: IncidentAdvancedSearch;
  sorter?: IncidentSort;
};

export type IncidentApiParams = {
  page: number;
  page_size: number;
  title?: string;
  title__exact?: string;
  external_id?: string;
  external_id__exact?: string;
  source_plugin_name?: string;
  source_plugin_name__exact?: string;
  severity?: AutoHealing.IncidentSeverity;
  healing_status?: AutoHealing.HealingStatus;
  status?: AutoHealing.IncidentStatus;
  scanned?: boolean;
  has_plugin?: boolean;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
};

export const searchFields: SearchField[] = [
  { key: 'title', label: '关键字' },
  { key: 'external_id', label: '外部 ID' },
];

export const advancedSearchFields: AdvancedSearchField[] = [
  { key: 'title', label: '标题', type: 'input', placeholder: '事件标题' },
  { key: 'external_id', label: '外部 ID', type: 'input', placeholder: '外部工单 ID' },
  { key: 'source_plugin_name', label: '来源插件', type: 'input', placeholder: '插件名称' },
  {
    key: 'severity',
    label: '严重程度',
    type: 'select',
    placeholder: '全部级别',
    options: getSeverityOptions(),
  },
  {
    key: 'healing_status',
    label: '自愈状态',
    type: 'select',
    placeholder: '全部状态',
    options: getHealingStatusOptions(),
  },
  {
    key: 'status',
    label: '工单状态',
    type: 'select',
    placeholder: '全部状态',
    options: getIncidentStatusOptions(),
  },
  {
    key: 'has_plugin',
    label: '关联插件',
    type: 'select',
    placeholder: '全部',
    options: [
      { label: '已关联', value: 'true' },
      { label: '未关联', value: 'false' },
    ],
  },
];

export const headerIcon = (
  <svg viewBox="0 0 48 48" fill="none">
    <rect x="4" y="6" width="40" height="36" rx="2" stroke="currentColor" strokeWidth="2" fill="none" />
    <line x1="4" y1="16" x2="44" y2="16" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="12" cy="25" r="3" fill="#f5222d" opacity="0.8" />
    <circle cx="12" cy="35" r="3" fill="#faad14" opacity="0.8" />
    <rect x="20" y="23" width="18" height="2" rx="1" fill="currentColor" opacity="0.3" />
    <rect x="20" y="33" width="14" height="2" rx="1" fill="currentColor" opacity="0.3" />
    <rect x="8" y="9" width="8" height="4" rx="1" fill="currentColor" opacity="0.2" />
  </svg>
);
