import type { AdvancedSearchField, SearchField } from '@/components/StandardTable';
import { ACTION_LABELS, PLATFORM_RESOURCE_LABELS as RESOURCE_LABELS } from '@/constants/auditDicts';

const AUTH_ACTIONS = ['login', 'logout', 'register'];
const AUTH_RESOURCES = ['auth', 'auth-logout', 'auth-register'];

export const operationSearchFields: SearchField[] = [
  { key: 'search', label: '全局搜索' },
  { key: 'username', label: '用户名' },
];

export const operationAdvancedSearchFields: AdvancedSearchField[] = [
  { key: 'search', label: '关键字', type: 'input', placeholder: '搜索用户名 / 资源名 / 路径' },
  { key: 'username', label: '用户名', type: 'input', placeholder: '精确用户名', defaultMatchMode: 'exact' },
  {
    key: 'action',
    label: '操作类型',
    type: 'select',
    placeholder: '全部操作',
    options: Object.entries(ACTION_LABELS)
      .filter(([value]) => !AUTH_ACTIONS.includes(value))
      .map(([value, label]) => ({ label, value })),
  },
  {
    key: 'resource_type',
    label: '资源类型',
    type: 'select',
    placeholder: '全部资源',
    options: Object.entries(RESOURCE_LABELS)
      .filter(([value]) => !AUTH_RESOURCES.includes(value))
      .map(([value, label]) => ({ label, value })),
  },
  {
    key: 'status',
    label: '操作结果',
    type: 'select',
    placeholder: '全部状态',
    options: [
      { label: '成功', value: 'success' },
      { label: '失败', value: 'failed' },
    ],
  },
  { key: 'created_at', label: '时间范围', type: 'dateRange' },
];

export const authSearchFields: SearchField[] = [
  { key: 'search', label: '全局搜索' },
  { key: 'username', label: '用户名' },
];

export const authAdvancedSearchFields: AdvancedSearchField[] = [
  { key: 'search', label: '关键字', type: 'input', placeholder: '搜索用户名 / 尝试用户名 / 租户 / IP 地址' },
  { key: 'username', label: '用户名', type: 'input', placeholder: '精确用户名', defaultMatchMode: 'exact' },
  {
    key: 'action',
    label: '认证事件',
    type: 'select',
    placeholder: '全部事件',
    options: AUTH_ACTIONS.map((value) => ({ label: ACTION_LABELS[value] || value, value })),
  },
  {
    key: 'status',
    label: '操作结果',
    type: 'select',
    placeholder: '全部状态',
    options: [
      { label: '成功', value: 'success' },
      { label: '失败', value: 'failed' },
    ],
  },
  { key: 'created_at', label: '时间范围', type: 'dateRange' },
];
