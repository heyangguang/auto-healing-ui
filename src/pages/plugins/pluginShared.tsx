import React from 'react';
import type {
  AdvancedSearchField,
  SearchField,
} from '@/components/StandardTable';
import { PLUGIN_STATUS_LABELS } from '@/constants/pluginDicts';
import type { PluginFilterOperator } from './pluginFormHelpers';

export type PluginTypeConfig = {
  bgColor: string;
  color: string;
  icon: React.ReactNode;
  label: string;
  value: 'itsm' | 'cmdb';
};

const pluginIconStyle: React.CSSProperties = {
  display: 'block',
  width: '1em',
  height: '1em',
};

const ITSMPluginIcon = (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
    style={pluginIconStyle}
  >
    <rect
      x="4.5"
      y="4.5"
      width="15"
      height="15"
      rx="3.2"
      stroke="currentColor"
      strokeWidth="1.8"
    />
    <path
      d="M8.5 9h7M8.5 12h7M8.5 15h4.5"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    <circle
      cx="16.75"
      cy="15.25"
      r="2"
      fill="currentColor"
      fillOpacity="0.18"
      stroke="currentColor"
      strokeWidth="1.5"
    />
  </svg>
);

const CMDBPluginIcon = (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
    style={pluginIconStyle}
  >
    <rect
      x="4.5"
      y="4.5"
      width="15"
      height="15"
      rx="3.2"
      stroke="currentColor"
      strokeWidth="1.8"
    />
    <path
      d="M8 9h8M8 12h8M8 15h8"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    <circle cx="9" cy="9" r="0.9" fill="currentColor" />
    <circle cx="9" cy="12" r="0.9" fill="currentColor" />
    <circle cx="9" cy="15" r="0.9" fill="currentColor" />
  </svg>
);

export const PLUGIN_TYPES: PluginTypeConfig[] = [
  {
    value: 'itsm',
    label: 'ITSM - 工单系统',
    icon: ITSMPluginIcon,
    color: '#1890ff',
    bgColor: '#e6f7ff',
  },
  {
    value: 'cmdb',
    label: 'CMDB - 配置管理',
    icon: CMDBPluginIcon,
    color: '#52c41a',
    bgColor: '#f6ffed',
  },
];

export const AUTH_TYPES = [
  { value: 'basic', label: 'Basic 认证 (用户名/密码)' },
  { value: 'bearer', label: 'Bearer Token' },
  { value: 'api_key', label: 'API Key' },
];

export const FILTER_OPERATORS = [
  { value: 'equals', label: '等于' },
  { value: 'not_equals', label: '不等于' },
  { value: 'contains', label: '包含' },
  { value: 'not_contains', label: '不包含' },
  { value: 'starts_with', label: '开头匹配' },
  { value: 'ends_with', label: '结尾匹配' },
  { value: 'in', label: '在列表中 (逗号分隔)' },
  { value: 'not_in', label: '不在列表中 (逗号分隔)' },
  { value: 'regex', label: '正则匹配' },
] satisfies Array<{ label: string; value: PluginFilterOperator }>;

export const ITSM_FIELDS = [
  { value: 'external_id', label: '外部工单ID' },
  { value: 'title', label: '标题' },
  { value: 'description', label: '描述' },
  { value: 'severity', label: '严重程度' },
  { value: 'priority', label: '优先级' },
  { value: 'status', label: '状态' },
  { value: 'category', label: '分类' },
  { value: 'affected_ci', label: '受影响配置项' },
  { value: 'affected_service', label: '受影响服务' },
  { value: 'assignee', label: '处理人' },
  { value: 'reporter', label: '报告人' },
];

export const CMDB_FIELDS = [
  { value: 'external_id', label: '外部ID' },
  { value: 'name', label: '名称' },
  { value: 'type', label: '类型' },
  { value: 'status', label: '状态' },
  { value: 'ip_address', label: 'IP地址' },
  { value: 'hostname', label: '主机名' },
  { value: 'os', label: '操作系统' },
  { value: 'os_version', label: '系统版本' },
  { value: 'cpu', label: 'CPU' },
  { value: 'memory', label: '内存' },
  { value: 'disk', label: '磁盘' },
  { value: 'location', label: '位置' },
  { value: 'owner', label: '负责人' },
  { value: 'environment', label: '环境' },
  { value: 'manufacturer', label: '厂商' },
  { value: 'model', label: '型号' },
  { value: 'serial_number', label: '序列号' },
  { value: 'department', label: '部门' },
];

export const PLUGIN_SEARCH_FIELDS: SearchField[] = [
  { key: 'name', label: '名称' },
];

export const PLUGIN_ADVANCED_SEARCH_FIELDS: AdvancedSearchField[] = [
  { key: 'name', label: '名称', type: 'input', placeholder: '插件名称' },
  { key: 'description', label: '描述', type: 'input', placeholder: '插件描述' },
  {
    key: 'type',
    label: '插件类型',
    type: 'select',
    placeholder: '全部类型',
    options: PLUGIN_TYPES.map(({ label, value }) => ({
      label: label.split(' - ')[0],
      value,
    })),
  },
  {
    key: 'status',
    label: '插件状态',
    type: 'select',
    placeholder: '全部状态',
    options: Object.entries(PLUGIN_STATUS_LABELS).map(([value, label]) => ({
      label,
      value,
    })),
  },
];

export const PLUGIN_LIST_HEADER_ICON = (
  <svg viewBox="0 0 48 48" fill="none">
    <title>插件列表图标</title>
    <rect
      x="8"
      y="8"
      width="32"
      height="32"
      rx="4"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
    />
    <path
      d="M24 16v16M16 24h16"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <circle
      cx="24"
      cy="24"
      r="6"
      stroke="currentColor"
      strokeWidth="1.5"
      fill="none"
      opacity="0.5"
    />
  </svg>
);

const AUTH_LABELS = Object.fromEntries(
  AUTH_TYPES.map(({ label, value }) => [value, label]),
);

export function getPluginTypeConfig(type: string): PluginTypeConfig {
  return PLUGIN_TYPES.find((item) => item.value === type) || PLUGIN_TYPES[0];
}

export function getPluginAuthLabel(authType?: string): string {
  return AUTH_LABELS[authType || ''] || authType || '-';
}
