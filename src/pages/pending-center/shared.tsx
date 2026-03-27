import React from 'react';
import {
  AlertOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  InfoCircleOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { Input, Modal, Tag, message } from 'antd';
import type { SearchField } from '@/components/StandardTable';
import { INCIDENT_SEVERITY_MAP, SEVERITY_TAG_COLORS } from '@/constants/incidentDicts';
import type { PendingApprovalRecord } from './types';
import dayjs, { type Dayjs } from 'dayjs';

export const PENDING_CENTER_TABS = [
  { key: 'triggers', label: '待触发工单' },
  { key: 'approvals', label: '待审批任务' },
];

export const triggerSearchFields: SearchField[] = [
  { key: 'title', label: '关键字', placeholder: '搜索工单标题' },
];

export const approvalSearchFields: SearchField[] = [
  { key: 'node_name', label: '关键字', placeholder: '搜索节点名称' },
];

const severityIconMap: Record<string, React.ReactNode> = {
  critical: <AlertOutlined />,
  high: <WarningOutlined />,
  medium: <InfoCircleOutlined />,
  low: <CheckCircleOutlined />,
  '1': <AlertOutlined />,
  '2': <WarningOutlined />,
  '3': <InfoCircleOutlined />,
  '4': <CheckCircleOutlined />,
};

const severityMap: Record<string, { color: string; label: string; icon: React.ReactNode }> = Object.fromEntries(
  Object.entries(INCIDENT_SEVERITY_MAP).map(([key, meta]) => [
    key,
    {
      color: SEVERITY_TAG_COLORS[key] || 'default',
      label: meta.text,
      icon: severityIconMap[key] || <InfoCircleOutlined />,
    },
  ]),
);

export const pendingCenterHeaderIcon = (
  <svg viewBox="0 0 48 48" fill="none">
    <rect x="10" y="8" width="28" height="34" rx="2" stroke="currentColor" strokeWidth="2" fill="none" />
    <path d="M18 8V6a6 6 0 0 1 12 0v2" stroke="currentColor" strokeWidth="2" fill="none" />
    <path d="M16 18l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <line x1="26" y1="18" x2="34" y2="18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M16 26l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <line x1="26" y1="26" x2="34" y2="26" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="19" cy="34" r="2.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <line x1="26" y1="34" x2="34" y2="34" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="36" cy="38" r="7" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.6" />
    <path d="M36 35v3l2 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
  </svg>
);

export function getSeverityTag(severity: string | number) {
  const value = String(severity).toLowerCase();
  const config = severityMap[value];
  if (config) {
    return <Tag color={config.color} icon={config.icon}>{config.label}</Tag>;
  }
  return <Tag color="default" icon={<CheckCircleOutlined />}>低</Tag>;
}

export function formatPendingCenterTime(value: string | null | undefined) {
  if (!value) {
    return '-';
  }
  return dayjs(value).format('YYYY-MM-DD HH:mm:ss');
}

export function resolveApprovalApprovers(
  record: PendingApprovalRecord,
  userMap: Record<string, string>,
) {
  const approverIds = record.approvers || [];
  if (approverIds.length === 0) {
    return '-';
  }

  const localMap = { ...userMap };
  const name = record.initiator?.display_name || record.initiator?.username || record.initiator?.id;
  if (record.initiator?.id && name) {
    localMap[record.initiator.id] = name;
  }
  if (record.initiator?.username && name) {
    localMap[record.initiator.username] = name;
  }

  return approverIds.map((id) => localMap[id] || `${id.substring(0, 8)}...`).join(', ');
}

type ApprovalDecisionModalOptions = {
  title: string;
  placeholder: string;
  okText: string;
  danger?: boolean;
  requireComment?: boolean;
  onSubmit: (comment: string) => Promise<void>;
};

export function openApprovalDecisionModal({
  title,
  placeholder,
  okText,
  danger = false,
  requireComment = false,
  onSubmit,
}: ApprovalDecisionModalOptions) {
  let comment = '';

  Modal.confirm({
    title,
    content: (
      <div style={{ marginTop: 16 }}>
        <Input.TextArea
          placeholder={placeholder}
          onChange={(event) => {
            comment = event.target.value;
          }}
        />
      </div>
    ),
    okText,
    cancelText: '取消',
    okButtonProps: danger ? { danger: true } : undefined,
    onOk: async () => {
      if (requireComment && !comment.trim()) {
        message.error('请输入拒绝原因');
        return Promise.reject(new Error('comment-required'));
      }
      await onSubmit(comment);
    },
  });
}

export interface TableSorter {
  field: string;
  order: 'ascend' | 'descend';
}

type TriggerAdvancedSearch = {
  title?: string;
  severity?: string;
};

export interface TriggerTableRequestParams {
  page: number;
  pageSize: number;
  searchField?: string;
  searchValue?: string;
  advancedSearch?: TriggerAdvancedSearch;
  sorter?: TableSorter;
}

type ApprovalAdvancedSearch = {
  node_name?: string;
  created_at?: [string | Dayjs | null | undefined, string | Dayjs | null | undefined];
};

export interface ApprovalTableRequestParams {
  page: number;
  pageSize: number;
  searchField?: string;
  searchValue?: string;
  advancedSearch?: ApprovalAdvancedSearch;
  sorter?: TableSorter;
}

export interface PendingTriggerApiParams {
  page: number;
  page_size: number;
  title?: string;
  severity?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface PendingApprovalApiParams {
  page: number;
  page_size: number;
  node_name?: string;
  date_from?: string;
  date_to?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

function setPendingTriggerFilter(
  apiParams: PendingTriggerApiParams,
  key?: string,
  value?: string,
) {
  if (!value) {
    return;
  }
  if (key === 'severity') {
    apiParams.severity = value;
    return;
  }
  apiParams.title = value;
}

export function buildPendingTriggerParams(params: TriggerTableRequestParams): PendingTriggerApiParams {
  const apiParams: PendingTriggerApiParams = {
    page: params.page,
    page_size: params.pageSize,
  };

  setPendingTriggerFilter(apiParams, params.searchField, params.searchValue);
  if (params.advancedSearch?.title) {
    apiParams.title = params.advancedSearch.title;
  }
  if (params.advancedSearch?.severity) {
    apiParams.severity = params.advancedSearch.severity;
  }
  if (params.sorter) {
    apiParams.sort_by = params.sorter.field;
    apiParams.sort_order = params.sorter.order === 'ascend' ? 'asc' : 'desc';
  }

  return apiParams;
}

export function buildPendingApprovalParams(params: ApprovalTableRequestParams): PendingApprovalApiParams {
  const apiParams: PendingApprovalApiParams = {
    page: params.page,
    page_size: params.pageSize,
  };

  if (params.searchValue) {
    apiParams.node_name = params.searchValue;
  }

  const createdAt = params.advancedSearch?.created_at;
  if (params.advancedSearch?.node_name) {
    apiParams.node_name = params.advancedSearch.node_name;
  }
  if (createdAt?.[0]) {
    apiParams.date_from = dayjs(createdAt[0]).format('YYYY-MM-DD');
  }
  if (createdAt?.[1]) {
    apiParams.date_to = dayjs(createdAt[1]).format('YYYY-MM-DD');
  }
  if (params.sorter) {
    apiParams.sort_by = params.sorter.field;
    apiParams.sort_order = params.sorter.order === 'ascend' ? 'asc' : 'desc';
  }

  return apiParams;
}
