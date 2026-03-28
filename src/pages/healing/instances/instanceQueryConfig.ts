import type { AdvancedSearchField, SearchField } from '@/components/StandardTable';
import { getApprovalStatusOptions, getInstanceStatusOptions } from '@/constants/instanceDicts';
import type { HealingInstanceQueryParams } from '@/services/auto-healing/instances';
import { toDayRangeEndISO, toDayRangeStartISO } from '@/utils/dateRange';

type DateLike = string | number | Date | import('dayjs').Dayjs;
type DateRangeValue = [DateLike | undefined | null, DateLike | undefined | null];

export type InstanceSearchParams = {
  status?: AutoHealing.FlowInstanceStatus;
  has_error?: 'true' | 'false';
  approval_status?: 'approved' | 'rejected';
  flow_name?: string;
  rule_name?: string;
  incident_title?: string;
  error_message?: string;
  created_at?: DateRangeValue;
  started_at?: DateRangeValue;
  completed_at?: DateRangeValue;
};

export type InstanceSearchRequest = {
  advancedSearch?: InstanceSearchParams;
  filters?: Array<{ field: string; value: string }>;
};

export const searchFields: SearchField[] = [
  { key: 'flow_name', label: '流程名称', placeholder: '搜索流程名称...', description: '按流程名称模糊搜索' },
  {
    key: '__enum__status',
    label: '实例状态',
    description: '筛选实例执行状态',
    options: getInstanceStatusOptions(),
  },
  { key: 'rule_name', label: '规则名称', placeholder: '输入规则名称搜索' },
  {
    key: '__enum__has_error',
    label: '有异常',
    description: '筛选包含错误信息的实例',
    options: [
      { label: '有异常', value: 'true' },
      { label: '无异常', value: 'false' },
    ],
  },
  {
    key: '__enum__approval_status',
    label: '审批结果',
    description: '筛选包含特定审批结果的实例',
    options: getApprovalStatusOptions(),
  },
];

export const advancedSearchFields: AdvancedSearchField[] = [
  { key: 'flow_name', label: '流程名称', type: 'input', placeholder: '输入流程名称搜索' },
  { key: 'rule_name', label: '规则名称', type: 'input', placeholder: '输入规则名称搜索' },
  { key: 'incident_title', label: '工单标题', type: 'input', placeholder: '输入工单标题搜索' },
  { key: 'error_message', label: '错误信息', type: 'input', placeholder: '输入错误信息关键字' },
  { key: 'created_at', label: '创建时间', type: 'dateRange' },
  { key: 'started_at', label: '开始时间', type: 'dateRange' },
  { key: 'completed_at', label: '完成时间', type: 'dateRange' },
];

export const SORT_OPTIONS = [
  { value: 'created_at', label: '创建时间' },
  { value: 'started_at', label: '开始时间' },
  { value: 'completed_at', label: '完成时间' },
  { value: 'flow_name', label: '流程名称' },
  { value: 'rule_name', label: '规则名称' },
];

function applyDateRange(
  params: HealingInstanceQueryParams,
  range: DateRangeValue | undefined,
  fromKey: 'created_from' | 'started_from' | 'completed_from',
  toKey: 'created_to' | 'started_to' | 'completed_to',
) {
  if (!range) {
    return;
  }

  const [from, to] = range;
  if (from) {
    params[fromKey] = toDayRangeStartISO(from);
  }
  if (to) {
    params[toKey] = toDayRangeEndISO(to);
  }
}

export function buildInstanceQueryParams(
  searchParams: InstanceSearchParams,
  page: number,
  pageSize: number,
  sortBy: string,
  sortOrder: 'asc' | 'desc',
): HealingInstanceQueryParams {
  const params: HealingInstanceQueryParams = {
    page,
    page_size: pageSize,
    sort_by: sortBy,
    sort_order: sortOrder,
  };

  if (searchParams.status) params.status = searchParams.status;
  if (searchParams.has_error) params.has_error = searchParams.has_error === 'true';
  if (searchParams.approval_status) params.approval_status = searchParams.approval_status;
  if (searchParams.flow_name) params.flow_name = searchParams.flow_name;
  if (searchParams.rule_name) params.rule_name = searchParams.rule_name;
  if (searchParams.incident_title) params.incident_title = searchParams.incident_title;
  if (searchParams.error_message) params.error_message = searchParams.error_message;

  applyDateRange(params, searchParams.created_at, 'created_from', 'created_to');
  applyDateRange(params, searchParams.started_at, 'started_from', 'started_to');
  applyDateRange(params, searchParams.completed_at, 'completed_from', 'completed_to');

  return params;
}

export function mergeInstanceSearchParams(params: InstanceSearchRequest): InstanceSearchParams {
  const merged: InstanceSearchParams = {};

  if (params.advancedSearch) {
    Object.assign(merged, params.advancedSearch);
  }

  if (!params.filters) {
    return merged;
  }

  for (const filter of params.filters) {
    const key = filter.field.replace(/^__enum__/, '') as keyof InstanceSearchParams;
    merged[key] = filter.value as never;
  }

  return merged;
}
