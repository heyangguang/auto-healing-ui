import { toDayRangeEndISO, toDayRangeStartISO } from '@/utils/dateRange';
import type {
  AuditApiParams,
  AuditAdvancedSearch,
  AuditCategory,
  AuditChangeEntry,
  AuditDateRange,
  AuditExportValues,
  AuditLogRecord,
  AuditRequestParams,
} from './types';

const SPECIAL_AUDIT_FILTER_KEYS = ['created_at', 'exclude_action', 'exclude_resource_type'] as const;

export const formatChangeValue = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') return JSON.stringify(value, null, 2);
  return String(value);
};

export const applyAuditDateRange = (params: AuditApiParams, dateRange?: AuditDateRange) => {
  if (!dateRange?.[0] || !dateRange?.[1]) return;
  params.created_after = toDayRangeStartISO(dateRange[0]);
  params.created_before = toDayRangeEndISO(dateRange[1]);
};

export const applyAuditSearchFilters = (
  params: AuditApiParams,
  advancedSearch?: AuditAdvancedSearch,
) => {
  if (!advancedSearch) return;
  applyAuditDateRange(params, advancedSearch.created_at as AuditDateRange | undefined);

  const excludeAction = advancedSearch.exclude_action;
  if (Array.isArray(excludeAction) && excludeAction.length > 0) {
    params.exclude_action = excludeAction.join(',');
  }

  const excludeResourceType = advancedSearch.exclude_resource_type;
  if (Array.isArray(excludeResourceType) && excludeResourceType.length > 0) {
    params.exclude_resource_type = excludeResourceType.join(',');
  }

  Object.entries(advancedSearch).forEach(([key, value]) => {
    if (SPECIAL_AUDIT_FILTER_KEYS.includes(key as typeof SPECIAL_AUDIT_FILTER_KEYS[number])) return;
    if (value === undefined || value === null || value === '' || Array.isArray(value)) return;
    params[key] = value;
  });
};

export const applyAuditExportFilters = (params: AuditApiParams, values: AuditExportValues) => {
  applyAuditDateRange(params, values.date_range);
  if (values.action) params.action = values.action;
  if (values.resource_type) params.resource_type = values.resource_type;
  if (values.username) params.username = values.username;
  if (values.status) params.status = values.status;
  if (values.risk_level) params.risk_level = values.risk_level;
};

export const buildAuditListParams = (
  params: AuditRequestParams,
  category: AuditCategory,
): AuditApiParams => {
  const apiParams: AuditApiParams = {
    page: params.page,
    page_size: params.pageSize,
    category,
  };

  if (params.searchValue) {
    if (params.searchField && params.searchField !== 'username') {
      apiParams[params.searchField] = params.searchValue;
    } else {
      apiParams.username = params.searchValue;
    }
  }

  applyAuditSearchFilters(apiParams, params.advancedSearch);

  if (params.sorter) {
    apiParams.sort_by = params.sorter.field;
    apiParams.sort_order = params.sorter.order === 'ascend' ? 'asc' : 'desc';
  }

  return apiParams;
};

export const buildAuditExportParams = (
  values: AuditExportValues,
  category: AuditCategory,
  page?: number,
  pageSize?: number,
): AuditApiParams => {
  const params: AuditApiParams = { category };
  if (page !== undefined) params.page = page;
  if (pageSize !== undefined) params.page_size = pageSize;
  applyAuditExportFilters(params, values);
  return params;
};

export const getDeletedChangeEntries = (changes?: AuditLogRecord['changes']) =>
  Object.entries(changes?.deleted ?? {});

export const getUpdatedChangeEntries = (changes?: AuditLogRecord['changes']) =>
  Object.entries(changes ?? {}).filter(([field]) => field !== 'deleted') as [string, AuditChangeEntry][];

export const extractAuditExportBlob = (response: Blob | { data: Blob }) =>
  response instanceof Blob ? response : response.data;
