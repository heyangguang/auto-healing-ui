import React from 'react';
import {
  AlertOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  InfoCircleOutlined,
  StopOutlined,
  ThunderboltOutlined,
  UndoOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { Button, Space, Tag, Typography } from 'antd';
import type {
  AdvancedSearchField,
  SearchField,
  StandardColumnDef,
} from '@/components/StandardTable';
import { INCIDENT_SEVERITY_MAP, SEVERITY_TAG_COLORS } from '@/constants/incidentDicts';
import type { PendingTriggerRecord } from './types';
import dayjs from 'dayjs';

const { Text } = Typography;

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

export const triggerSearchFields: SearchField[] = [
  { key: 'title', label: '工单标题', placeholder: '搜索工单标题' },
];

export const triggerAdvancedSearchFields: AdvancedSearchField[] = [
  {
    key: 'severity',
    label: '等级',
    type: 'select',
    options: [
      { label: '严重', value: 'critical' },
      { label: '高', value: 'high' },
      { label: '中', value: 'medium' },
      { label: '低', value: 'low' },
    ],
  },
  { key: 'created_at', label: '创建时间', type: 'dateRange' },
];

export type TableSorter = { field: string; order: 'ascend' | 'descend' };

export type TriggerAdvancedSearch = {
  severity?: string;
  created_at?: [string | dayjs.Dayjs | null | undefined, string | dayjs.Dayjs | null | undefined];
};

export type TriggerTableRequestParams = {
  page: number;
  pageSize: number;
  searchField?: string;
  searchValue?: string;
  advancedSearch?: TriggerAdvancedSearch;
  sorter?: TableSorter;
};

export type TriggerApiParams = {
  page: number;
  page_size: number;
  title?: string;
  severity?: string;
  date_from?: string;
  date_to?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
};

export const triggerHeaderIcon = (
  <svg viewBox="0 0 48 48" fill="none">
    <rect x="10" y="8" width="28" height="34" rx="2" stroke="currentColor" strokeWidth="2" fill="none" />
    <path d="M18 8V6a6 6 0 0 1 12 0v2" stroke="currentColor" strokeWidth="2" fill="none" />
    <path d="M16 18l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <line x1="26" y1="18" x2="34" y2="18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M16 26l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <line x1="26" y1="26" x2="34" y2="26" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="36" cy="38" r="7" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.6" />
    <path d="M36 35v3l2 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
  </svg>
);

export function getTriggerSeverityTag(severity: string | number) {
  const value = String(severity).toLowerCase();
  const config = severityMap[value];
  if (config) {
    return <Tag color={config.color} icon={config.icon}>{config.label}</Tag>;
  }
  return <Tag color="default" icon={<CheckCircleOutlined />}>低</Tag>;
}

export function formatTriggerTime(value: string | null | undefined) {
  if (!value) {
    return '-';
  }
  return dayjs(value).format('YYYY-MM-DD HH:mm:ss');
}

function setTriggerFilter(
  apiParams: TriggerApiParams,
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

export function buildTriggerApiParams(params: TriggerTableRequestParams): TriggerApiParams {
  const apiParams: TriggerApiParams = {
    page: params.page,
    page_size: params.pageSize,
  };

  setTriggerFilter(apiParams, params.searchField, params.searchValue);
  if (params.advancedSearch?.severity) {
    apiParams.severity = params.advancedSearch.severity;
  }
  const createdAt = params.advancedSearch?.created_at;
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

type TriggerColumnsOptions = {
  canTriggerHealing: boolean;
  onTrigger: (record: PendingTriggerRecord) => void;
  onDismiss: (record: PendingTriggerRecord) => void;
  onResetScan: (record: PendingTriggerRecord) => void;
};

const sharedColumns: StandardColumnDef<PendingTriggerRecord>[] = [
  {
    columnKey: 'title',
    columnTitle: '工单标题',
    dataIndex: 'title',
    ellipsis: true,
    fixedColumn: true,
  },
  {
    columnKey: 'external_id',
    columnTitle: '工单ID',
    dataIndex: 'external_id',
    width: 200,
  },
  {
    columnKey: 'severity',
    columnTitle: '等级',
    dataIndex: 'severity',
    width: 100,
    render: (_, record) => getTriggerSeverityTag(record.severity),
    headerFilters: [
      { label: '严重', value: 'critical' },
      { label: '高', value: 'high' },
      { label: '中', value: 'medium' },
      { label: '低', value: 'low' },
    ],
  },
  {
    columnKey: 'affected_ci',
    columnTitle: '影响CI',
    dataIndex: 'affected_ci',
    width: 150,
    ellipsis: true,
  },
  {
    columnKey: 'affected_service',
    columnTitle: '影响服务',
    dataIndex: 'affected_service',
    width: 150,
    ellipsis: true,
  },
];

export function createPendingTriggerColumns({
  canTriggerHealing,
  onTrigger,
  onDismiss,
}: TriggerColumnsOptions): StandardColumnDef<PendingTriggerRecord>[] {
  return [
    ...sharedColumns,
    {
      columnKey: 'created_at',
      columnTitle: '创建时间',
      dataIndex: 'created_at',
      width: 180,
      sorter: true,
      render: (_, record) => formatTriggerTime(record.created_at),
    },
    {
      columnKey: 'actions',
      columnTitle: '操作',
      width: 150,
      fixedColumn: true,
      fixed: 'right',
      render: (_, record) => (
        <Space size={4}>
          <Button
            type="primary"
            size="small"
            icon={<ThunderboltOutlined />}
            disabled={!canTriggerHealing}
            onClick={() => onTrigger(record)}
          >
            启动
          </Button>
          <Button
            danger
            size="small"
            icon={<StopOutlined />}
            disabled={!canTriggerHealing}
            onClick={() => onDismiss(record)}
          >
            忽略
          </Button>
        </Space>
      ),
    },
  ];
}

export function createDismissedTriggerColumns({
  canTriggerHealing,
  onResetScan,
}: TriggerColumnsOptions): StandardColumnDef<PendingTriggerRecord>[] {
  return [
    ...sharedColumns,
    {
      columnKey: 'created_at',
      columnTitle: '创建时间',
      dataIndex: 'created_at',
      width: 180,
      sorter: true,
      render: (_, record) => formatTriggerTime(record.created_at),
    },
    {
      columnKey: 'updated_at',
      columnTitle: '忽略时间',
      dataIndex: 'updated_at',
      width: 180,
      sorter: true,
      render: (_, record) => formatTriggerTime(record.updated_at),
    },
    {
      columnKey: 'actions',
      columnTitle: '操作',
      width: 100,
      fixedColumn: true,
      fixed: 'right',
      render: (_, record) => (
        <Button
          size="small"
          icon={<UndoOutlined />}
          disabled={!canTriggerHealing}
          onClick={() => onResetScan(record)}
        >
          恢复
        </Button>
      ),
    },
  ];
}
