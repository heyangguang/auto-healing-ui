import React from 'react';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  MinusCircleOutlined,
  StopOutlined,
} from '@ant-design/icons';
import { Tag } from 'antd';
import {
  IMPERSONATION_STATUS_OPTIONS,
  getImpersonationStatusMeta,
} from '@/constants/accessDicts';
import dayjs from 'dayjs';
import type {
  ImpersonationListParams,
  ImpersonationRequest,
  ImpersonationStatus,
} from '@/services/auto-healing/platform/impersonation';

type TableSorter = {
  field: string;
  order: 'ascend' | 'descend';
};
const EXACT_SUFFIX = '__exact';
const QUICK_STATUS_FILTER_KEY = '__enum__status';
const TEXT_SEARCH_FIELDS = ['requester_name', 'tenant_name', 'reason'] as const;
const SEARCH_FIELDS = [...TEXT_SEARCH_FIELDS, 'status'] as const;
type TextSearchField = (typeof TEXT_SEARCH_FIELDS)[number];
type ImpersonationSearchField = (typeof SEARCH_FIELDS)[number];
type ExactSearchField = `${TextSearchField}${typeof EXACT_SUFFIX}`;
type ImpersonationSearchFilters = Partial<
  Record<ImpersonationSearchField | ExactSearchField | typeof QUICK_STATUS_FILTER_KEY, string>
>;
type ImpersonationFilterCriterion = {
  field: ImpersonationSearchField;
  value: string;
  exact: boolean;
};

export interface ImpersonationTableRequestParams {
  page: number;
  pageSize: number;
  searchField?: keyof ImpersonationSearchFilters | string;
  searchValue?: string;
  advancedSearch?: ImpersonationSearchFilters;
  sorter?: TableSorter;
}

const STATUS_ICON_REGISTRY: Record<string, React.ReactNode> = {
  pending: <ClockCircleOutlined />,
  approved: <CheckCircleOutlined />,
  rejected: <CloseCircleOutlined />,
  active: <EyeOutlined />,
  completed: <CheckCircleOutlined />,
  expired: <StopOutlined />,
  cancelled: <MinusCircleOutlined />,
};

export const impersonationStatusOptions = IMPERSONATION_STATUS_OPTIONS;
export function renderImpersonationStatusTag(status: ImpersonationStatus) {
  const meta = getImpersonationStatusMeta(status);
  return <Tag color={meta.tagColor} icon={STATUS_ICON_REGISTRY[status]} style={{ margin: 0 }}>{meta.label}</Tag>;
}
export function formatImpersonationTime(value: string | null | undefined) {
  if (!value) {
    return '—';
  }
  return dayjs(value).format('YYYY-MM-DD HH:mm:ss');
}
export function formatImpersonationDuration(minutes: number) {
  if (minutes >= 60) {
    return `${minutes / 60}h`;
  }
  return `${minutes}min`;
}

function isImpersonationSearchField(value: string): value is ImpersonationSearchField {
  return SEARCH_FIELDS.includes(value as ImpersonationSearchField);
}

function normalizeImpersonationFilterKey(key: string): { field: ImpersonationSearchField; exact: boolean } | null {
  if (key === QUICK_STATUS_FILTER_KEY) {
    return { field: 'status', exact: true };
  }

  if (key.endsWith(EXACT_SUFFIX)) {
    const baseKey = key.slice(0, -EXACT_SUFFIX.length);
    if (TEXT_SEARCH_FIELDS.includes(baseKey as TextSearchField)) {
      return { field: baseKey as TextSearchField, exact: true };
    }
    return null;
  }

  if (!isImpersonationSearchField(key)) {
    return null;
  }

  return {
    field: key,
    exact: key === 'status',
  };
}
function setImpersonationListParam(
  params: ImpersonationListParams,
  key: string,
  value: string | undefined,
  options?: {
    allowExact?: boolean;
    allowedFields?: readonly ImpersonationSearchField[];
  },
) {
  if (!value) {
    return;
  }

  const normalized = normalizeImpersonationFilterKey(key);
  if (!normalized) {
    return;
  }

  if (options?.allowedFields && !options.allowedFields.includes(normalized.field)) {
    return;
  }

  const useExact = options?.allowExact ? normalized.exact : false;

  if (normalized.field === 'status') {
    params.status = value as ImpersonationStatus;
    return;
  }

  if (normalized.field === 'requester_name') {
    if (useExact) {
      params.requester_name__exact = value;
      return;
    }
    params.requester_name = value;
    return;
  }

  if (normalized.field === 'tenant_name') {
    if (useExact) {
      params.tenant_name__exact = value;
      return;
    }
    params.tenant_name = value;
    return;
  }

  if (useExact) {
    params.reason__exact = value;
    return;
  }
  params.reason = value;
}
function collectImpersonationFilterCriteria(
  params: ImpersonationTableRequestParams,
): ImpersonationFilterCriterion[] {
  const criteria = new Map<string, ImpersonationFilterCriterion>();
  if (params.searchField && params.searchValue) {
    const normalized = normalizeImpersonationFilterKey(params.searchField);
    if (normalized) {
      criteria.set(normalized.field, { ...normalized, value: params.searchValue });
    }
  }

  Object.entries(params.advancedSearch || {}).forEach(([key, value]) => {
    if (!value) {
      return;
    }
    const normalized = normalizeImpersonationFilterKey(key);
    if (normalized) {
      criteria.set(normalized.field, { ...normalized, value });
    }
  });

  return [...criteria.values()];
}
function matchesImpersonationCriterion(
  item: ImpersonationRequest,
  criterion: ImpersonationFilterCriterion,
) {
  const recordValue = String(item[criterion.field] || '').toLowerCase();
  const expectedValue = criterion.value.toLowerCase();

  if (criterion.exact) {
    return recordValue === expectedValue;
  }

  return recordValue.includes(expectedValue);
}

function sortImpersonationItems(
  items: ImpersonationRequest[],
  sorter?: TableSorter,
) {
  if (!sorter) {
    return [...items];
  }

  return [...items].sort((left, right) => {
    const leftValue = String(left[sorter.field as keyof ImpersonationRequest] || '');
    const rightValue = String(right[sorter.field as keyof ImpersonationRequest] || '');
    const result = leftValue.localeCompare(rightValue);
    return sorter.order === 'ascend' ? result : result * -1;
  });
}

function paginateImpersonationItems(
  items: ImpersonationRequest[],
  page: number,
  pageSize: number,
) {
  const startIndex = (page - 1) * pageSize;
  return items.slice(startIndex, startIndex + pageSize);
}

export function buildImpersonationListParams(
  params: ImpersonationTableRequestParams,
): ImpersonationListParams {
  return buildScopedImpersonationListParams(params, {
    allowExact: true,
    allowSorter: true,
    allowedFields: SEARCH_FIELDS,
  });
}

export function buildTenantImpersonationHistoryParams(
  params: ImpersonationTableRequestParams,
): ImpersonationListParams {
  return buildScopedImpersonationListParams(params, {
    allowExact: false,
    allowSorter: false,
    allowedFields: ['requester_name', 'reason', 'status'],
  });
}

export function buildPlatformImpersonationParams(
  params: ImpersonationTableRequestParams,
): ImpersonationListParams {
  return buildScopedImpersonationListParams(params, {
    allowExact: true,
    allowSorter: false,
    allowedFields: ['tenant_name', 'reason', 'status'],
  });
}

function buildScopedImpersonationListParams(
  params: ImpersonationTableRequestParams,
  options: {
    allowExact: boolean;
    allowSorter: boolean;
    allowedFields: readonly ImpersonationSearchField[];
  },
) {
  const apiParams: ImpersonationListParams = {
    page: params.page,
    page_size: params.pageSize,
  };

  if (params.searchField && params.searchValue) {
    setImpersonationListParam(apiParams, params.searchField, params.searchValue, options);
  }

  Object.entries(params.advancedSearch || {}).forEach(([key, value]) => {
    setImpersonationListParam(apiParams, key, value, options);
  });

  if (options.allowSorter && params.sorter) {
    apiParams.sort_by = params.sorter.field;
    apiParams.sort_order = params.sorter.order === 'ascend' ? 'asc' : 'desc';
  }

  return apiParams;
}

export function getImpersonationPendingStats(items: ImpersonationRequest[]) {
  return items.filter((item) => item.status === 'pending').length;
}

export function applyImpersonationTableRequest(
  items: ImpersonationRequest[],
  params: ImpersonationTableRequestParams,
) {
  const filteredItems = items.filter((item) => (
    collectImpersonationFilterCriteria(params).every((criterion) => (
      matchesImpersonationCriterion(item, criterion)
    ))
  ));
  const sortedItems = sortImpersonationItems(filteredItems, params.sorter);

  return {
    data: paginateImpersonationItems(sortedItems, params.page, params.pageSize),
    total: sortedItems.length,
  };
}
