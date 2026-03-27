import type { AdvancedSearchField, SearchField } from '@/components/StandardTable';
import { toDayRangeEndISO, toDayRangeStartISO } from '@/utils/dateRange';

type DateLike = string | number | Date | import('dayjs').Dayjs;
type DateRangeValue = [DateLike | undefined | null, DateLike | undefined | null];

export type FlowSearchParams = {
  name?: string;
  name__exact?: string;
  description?: string;
  description__exact?: string;
  is_active?: 'true' | 'false';
  node_type?: string;
  node_count?: 'few' | 'medium' | 'many';
  created_at?: DateRangeValue;
  updated_at?: DateRangeValue;
};

export type FlowSearchRequest = {
  advancedSearch?: FlowSearchParams;
  filters?: Array<{ field: string; value: string }>;
};

type FlowQueryParams = {
  page: number;
  page_size: number;
  is_active?: boolean;
  name?: string;
  name__exact?: string;
  description?: string;
  description__exact?: string;
  node_type?: string;
  min_nodes?: number;
  max_nodes?: number;
  sort_by: string;
  sort_order: 'asc' | 'desc';
  created_from?: string;
  created_to?: string;
  updated_from?: string;
  updated_to?: string;
};

export const searchFields: SearchField[] = [
  { key: 'name', label: '名称', placeholder: '输入流程名称搜索' },
  { key: 'description', label: '描述', placeholder: '输入描述关键字搜索' },
  {
    key: '__enum__is_active',
    label: '流程状态',
    description: '筛选流程启用/停用状态',
    options: [
      { label: '已启用', value: 'true' },
      { label: '已停用', value: 'false' },
    ],
  },
  {
    key: '__enum__node_type',
    label: '节点类型',
    description: '筛选包含指定节点类型的流程',
    options: [
      { label: '执行节点', value: 'execution' },
      { label: '审批节点', value: 'approval' },
      { label: '通知节点', value: 'notification' },
      { label: '条件节点', value: 'condition' },
      { label: '主机提取', value: 'host_extractor' },
      { label: 'CMDB校验', value: 'cmdb_validator' },
      { label: '变量设置', value: 'set_variable' },
    ],
  },
  {
    key: '__enum__node_count',
    label: '节点数量',
    description: '按流程包含的节点数量范围筛选',
    options: [
      { label: '少量 (≤3)', value: 'few' },
      { label: '中等 (4-6)', value: 'medium' },
      { label: '大量 (≥7)', value: 'many' },
    ],
  },
];

export const advancedSearchFields: AdvancedSearchField[] = [
  {
    key: 'node_type',
    label: '节点类型',
    type: 'select',
    description: '筛选包含指定节点类型的流程',
    options: [
      { label: '执行节点', value: 'execution' },
      { label: '审批节点', value: 'approval' },
      { label: '通知节点', value: 'notification' },
      { label: '条件节点', value: 'condition' },
      { label: '主机提取', value: 'host_extractor' },
      { label: 'CMDB校验', value: 'cmdb_validator' },
      { label: '变量设置', value: 'set_variable' },
    ],
  },
  { key: 'created_at', label: '创建时间', type: 'dateRange' },
  { key: 'updated_at', label: '更新时间', type: 'dateRange' },
];

export const SORT_OPTIONS = [
  { value: 'created_at', label: '创建时间' },
  { value: 'updated_at', label: '更新时间' },
  { value: 'name', label: '名称' },
];

export function buildFlowQueryParams(
  searchParams: FlowSearchParams,
  page: number,
  pageSize: number,
  sortBy: string,
  sortOrder: 'asc' | 'desc',
): FlowQueryParams {
  const params: FlowQueryParams = {
    page,
    page_size: pageSize,
    sort_by: sortBy,
    sort_order: sortOrder,
  };

  if (searchParams.name) params.name = searchParams.name;
  if (searchParams.name__exact) params.name__exact = searchParams.name__exact;
  if (searchParams.description) params.description = searchParams.description;
  if (searchParams.description__exact) params.description__exact = searchParams.description__exact;
  if (searchParams.is_active) params.is_active = searchParams.is_active === 'true';
  if (searchParams.node_type) params.node_type = searchParams.node_type;

  if (searchParams.node_count === 'few') params.max_nodes = 3;
  if (searchParams.node_count === 'medium') {
    params.min_nodes = 4;
    params.max_nodes = 6;
  }
  if (searchParams.node_count === 'many') params.min_nodes = 7;

  if (searchParams.created_at) {
    const [from, to] = searchParams.created_at;
    if (from) params.created_from = toDayRangeStartISO(from);
    if (to) params.created_to = toDayRangeEndISO(to);
  }

  if (searchParams.updated_at) {
    const [from, to] = searchParams.updated_at;
    if (from) params.updated_from = toDayRangeStartISO(from);
    if (to) params.updated_to = toDayRangeEndISO(to);
  }

  return params;
}

export function mergeFlowSearchParams(params: FlowSearchRequest): FlowSearchParams {
  const merged: FlowSearchParams = {};

  if (params.advancedSearch) {
    Object.assign(merged, params.advancedSearch);
  }

  if (!params.filters) {
    return merged;
  }

  for (const filter of params.filters) {
    const key = filter.field.replace(/^__enum__/, '') as keyof FlowSearchParams;
    merged[key] = filter.value as never;
  }

  return merged;
}
