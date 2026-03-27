import type { AdvancedSearchField, SearchField } from '@/components/StandardTable';
import { AUDIT_RESULT_OPTIONS } from '@/constants/commonDicts';
import { ACTION_LABELS, TENANT_RESOURCE_LABELS as RESOURCE_LABELS } from '@/constants/auditDicts';

const LOGIN_ACTIONS = ['login', 'logout', 'impersonation_enter', 'impersonation_exit'];
const LOGIN_RESOURCES = ['auth', 'auth-logout', 'impersonation'];

export const AUDIT_RISK_LEVEL_OPTIONS = [
  { label: '高危', value: 'high' },
  { label: '普通', value: 'normal' },
];

export const operationSearchFields: SearchField[] = [
  { key: 'search', label: '全局搜索' },
  { key: 'username', label: '用户名' },
  { key: 'request_path', label: '请求路径' },
];

export const operationAdvancedSearchFields: AdvancedSearchField[] = [
  { key: 'search', label: '关键字', type: 'input', placeholder: '搜索用户名 / 资源名 / 路径' },
  { key: 'username__exact', label: '用户名', type: 'input', placeholder: '精确用户名' },
  {
    key: 'action',
    label: '操作类型',
    type: 'select',
    placeholder: '全部操作',
    options: Object.entries(ACTION_LABELS)
      .filter(([value]) => !LOGIN_ACTIONS.includes(value))
      .map(([value, label]) => ({ label, value })),
  },
  {
    key: 'resource_type',
    label: '资源类型',
    type: 'select',
    placeholder: '全部资源',
    options: Object.entries(RESOURCE_LABELS)
      .filter(([value]) => !LOGIN_RESOURCES.includes(value))
      .map(([value, label]) => ({ label, value })),
  },
  {
    key: 'status',
    label: '操作结果',
    type: 'select',
    placeholder: '全部状态',
    options: AUDIT_RESULT_OPTIONS,
  },
  {
    key: 'risk_level',
    label: '风险等级',
    type: 'select',
    placeholder: '全部',
    options: AUDIT_RISK_LEVEL_OPTIONS,
  },
  { key: 'created_at', label: '时间范围', type: 'dateRange' },
];

export const loginSearchFields: SearchField[] = [
  { key: 'search', label: '全局搜索' },
  { key: 'username', label: '用户名' },
];

export const loginAdvancedSearchFields: AdvancedSearchField[] = [
  { key: 'search', label: '关键字', type: 'input', placeholder: '搜索用户名 / IP 地址' },
  { key: 'username__exact', label: '用户名', type: 'input', placeholder: '精确用户名' },
  {
    key: 'status',
    label: '操作结果',
    type: 'select',
    placeholder: '全部状态',
    options: AUDIT_RESULT_OPTIONS,
  },
  { key: 'created_at', label: '时间范围', type: 'dateRange' },
];
