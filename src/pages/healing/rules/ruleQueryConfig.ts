import type { AdvancedSearchField, SearchField } from '@/components/StandardTable';
import type { HealingRuleQueryParams } from '@/services/auto-healing/healing-rules';
import { toDayRangeEndISO, toDayRangeStartISO } from '@/utils/dateRange';

type DateLike = string | number | Date | import('dayjs').Dayjs;
type DateRangeValue = [DateLike | undefined | null, DateLike | undefined | null];

export type RuleSearchParams = {
  name?: string;
  name__exact?: string;
  description?: string;
  description__exact?: string;
  is_active?: 'true' | 'false';
  trigger_mode?: AutoHealing.TriggerMode;
  priority?: string;
  match_mode?: AutoHealing.MatchMode;
  has_flow?: 'true' | 'false';
  created_at?: DateRangeValue;
};

export type RuleSearchRequest = {
  advancedSearch?: RuleSearchParams;
  filters?: Array<{ field: string; value: string }>;
};

export const searchFields: SearchField[] = [
  { key: 'name', label: '名称', placeholder: '输入规则名称搜索' },
  {
    key: '__enum__is_active',
    label: '启用状态',
    options: [
      { label: '已启用', value: 'true' },
      { label: '已停用', value: 'false' },
    ],
  },
  {
    key: '__enum__trigger_mode',
    label: '触发模式',
    options: [
      { label: '自动触发', value: 'auto' },
      { label: '人工触发', value: 'manual' },
    ],
  },
];

export const advancedSearchFields: AdvancedSearchField[] = [
  {
    key: 'priority',
    label: '优先级',
    type: 'select',
    description: '按规则优先级过滤（0-100）',
    options: [
      { label: '高优先级 (90+)', value: '90' },
      { label: '中优先级 (50+)', value: '50' },
      { label: '低优先级 (<50)', value: '10' },
    ],
  },
  {
    key: 'match_mode',
    label: '匹配模式',
    type: 'select',
    description: '按条件匹配模式过滤',
    options: [
      { label: 'AND（全部匹配）', value: 'all' },
      { label: 'OR（任一匹配）', value: 'any' },
    ],
  },
  {
    key: 'has_flow',
    label: '流程关联',
    type: 'select',
    description: '筛选是否已关联自愈流程',
    options: [
      { label: '已关联流程', value: 'true' },
      { label: '未关联流程', value: 'false' },
    ],
  },
  { key: 'created_at', label: '创建时间', type: 'dateRange' },
];

export const SORT_OPTIONS = [
  { value: 'priority', label: '优先级' },
  { value: 'created_at', label: '创建时间' },
  { value: 'updated_at', label: '更新时间' },
  { value: 'name', label: '名称' },
  { value: 'conditions_count', label: '条件数量' },
];

export function buildRuleQueryParams(
  searchParams: RuleSearchParams,
  page: number,
  pageSize: number,
  sortBy: string,
  sortOrder: 'asc' | 'desc',
): HealingRuleQueryParams {
  const params: HealingRuleQueryParams = {
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
  if (searchParams.trigger_mode) params.trigger_mode = searchParams.trigger_mode;
  if (searchParams.priority) params.priority = Number(searchParams.priority);
  if (searchParams.match_mode) params.match_mode = searchParams.match_mode;
  if (searchParams.has_flow) params.has_flow = searchParams.has_flow === 'true';

  if (searchParams.created_at) {
    const [from, to] = searchParams.created_at;
    if (from) params.created_from = toDayRangeStartISO(from);
    if (to) params.created_to = toDayRangeEndISO(to);
  }

  return params;
}

export function mergeRuleSearchParams(params: RuleSearchRequest): RuleSearchParams {
  const merged: RuleSearchParams = {};

  if (params.advancedSearch) {
    Object.assign(merged, params.advancedSearch);
  }

  if (!params.filters) {
    return merged;
  }

  for (const filter of params.filters) {
    const key = filter.field.replace(/^__enum__/, '') as keyof RuleSearchParams;
    merged[key] = filter.value as never;
  }

  return merged;
}
