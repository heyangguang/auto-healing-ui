import React from 'react';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { Tag } from 'antd';
import type {
  AdvancedSearchField,
  SearchField,
} from '@/components/StandardTable';
import type { ExemptionRecord } from '@/services/auto-healing/blacklistExemption';
import dayjs from 'dayjs';

export const QUICK_STATUS_FILTER_KEY = '__enum__status';
export const exemptionSeverityColors: Record<string, string> = {
  critical: 'red',
  high: 'orange',
  medium: 'gold',
};

export const exemptionStatusMap: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
  pending: { color: 'processing', label: '待审批', icon: <ClockCircleOutlined /> },
  approved: { color: 'success', label: '已批准', icon: <CheckCircleOutlined /> },
  rejected: { color: 'error', label: '已拒绝', icon: <CloseCircleOutlined /> },
  expired: { color: 'warning', label: '已过期', icon: <ExclamationCircleOutlined /> },
};

const severityColors: Record<string, string> = {
  critical: 'red',
  high: 'orange',
  medium: 'gold',
};

export const exemptionSearchFields: SearchField[] = [
  { key: 'task_name', label: '任务模板', placeholder: '搜索任务模板名称' },
  { key: 'rule_name', label: '豁免规则', placeholder: '搜索规则名称' },
  {
    key: QUICK_STATUS_FILTER_KEY,
    label: '状态',
    options: Object.entries(exemptionStatusMap).map(([value, meta]) => ({ label: meta.label, value })),
  },
];

export const exemptionAdvancedSearchFields: AdvancedSearchField[] = [
  { key: 'task_name', label: '任务模板', type: 'input', placeholder: '任务模板名称' },
  { key: 'rule_name', label: '豁免规则', type: 'input', placeholder: '规则名称' },
  { key: 'requester_name', label: '申请人', type: 'input', placeholder: '申请人名称' },
  {
    key: 'status',
    label: '状态',
    type: 'select',
    placeholder: '全部状态',
    options: Object.entries(exemptionStatusMap).map(([value, meta]) => ({ label: meta.label, value })),
  },
];

export type TableSorter = { field: string; order: 'ascend' | 'descend' };

export type ExemptionHistorySearch = {
  task_name?: string;
  rule_name?: string;
  requester_name?: string;
  status?: string;
  status__exact?: string;
  [QUICK_STATUS_FILTER_KEY]?: string;
};

export type ExemptionHistoryRequestParams = {
  page: number;
  pageSize: number;
  searchField?: string;
  searchValue?: string;
  advancedSearch?: ExemptionHistorySearch;
  sorter?: TableSorter;
};

export type ExemptionHistoryApiParams = {
  page: number;
  page_size: number;
  task_name?: string;
  rule_name?: string;
  requester_name?: string;
  status?: ExemptionRecord['status'];
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
};

export const exemptionHeaderIcon = (
  <svg viewBox="0 0 48 48" fill="none">
    <rect x="6" y="10" width="26" height="32" rx="3" stroke="currentColor" strokeWidth="2" fill="none" />
    <path d="M12 20h14M12 26h10M12 32h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="36" cy="16" r="9" stroke="currentColor" strokeWidth="2" fill="none" />
    <path d="M36 12v4l2 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M34 36l-3 3 1 1 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
  </svg>
);

export function renderExemptionStatusTag(status: string) {
  const meta = exemptionStatusMap[status] || { color: 'default', label: status, icon: null };
  return <Tag color={meta.color} icon={meta.icon} style={{ margin: 0 }}>{meta.label}</Tag>;
}

export function formatExemptionTime(value: string | null | undefined) {
  if (!value) {
    return '—';
  }
  return dayjs(value).format('YYYY-MM-DD HH:mm');
}

function setExemptionHistoryFilter(
  apiParams: ExemptionHistoryApiParams,
  key: string,
  value?: string,
) {
  if (!value) {
    return;
  }

  if (key === QUICK_STATUS_FILTER_KEY || key === 'status' || key === 'status__exact') {
    apiParams.status = value as ExemptionRecord['status'];
    return;
  }
  if (key === 'task_name') {
    apiParams.task_name = value;
    return;
  }
  if (key === 'rule_name') {
    apiParams.rule_name = value;
    return;
  }
  if (key === 'requester_name') {
    apiParams.requester_name = value;
  }
}

export function buildExemptionHistoryApiParams(
  params: ExemptionHistoryRequestParams,
): ExemptionHistoryApiParams {
  const apiParams: ExemptionHistoryApiParams = {
    page: params.page,
    page_size: params.pageSize,
  };

  if (params.searchField && params.searchValue) {
    setExemptionHistoryFilter(apiParams, params.searchField, params.searchValue);
  }
  Object.entries(params.advancedSearch || {}).forEach(([key, value]) => {
    setExemptionHistoryFilter(apiParams, key, value);
  });
  if (params.sorter) {
    apiParams.sort_by = params.sorter.field;
    apiParams.sort_order = params.sorter.order === 'ascend' ? 'asc' : 'desc';
  }

  return apiParams;
}
