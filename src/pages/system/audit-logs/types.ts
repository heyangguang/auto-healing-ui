import dayjs from 'dayjs';

export type AuditLogUserSummary = {
  display_name?: string;
};

export type AuditChangeEntry = {
  old?: unknown;
  new?: unknown;
};

export type AuditLogRecord = {
  id: string;
  username?: string;
  user?: AuditLogUserSummary;
  action?: string;
  resource_type?: string;
  resource_name?: string;
  resource_id?: string;
  request_method?: string;
  request_path?: string;
  request_body?: unknown;
  response_status?: number;
  status?: string;
  risk_level?: string;
  risk_reason?: string;
  ip_address?: string;
  user_agent?: string;
  error_message?: string;
  created_at?: string;
  updated_at?: string;
  changes?: Record<string, AuditChangeEntry> & {
    deleted?: Record<string, unknown>;
  };
};

export type AuditStatsSummary = {
  total_count?: number;
  success_count?: number;
  failed_count?: number;
  high_risk_count?: number;
  today_count?: number;
};

export type TrendPoint = {
  date: string;
  count: number;
};

export type AuditCategory = 'operation' | 'login';
export type AuditDateRange = [dayjs.Dayjs | null, dayjs.Dayjs | null];
export type AuditSearchValue = string | string[] | AuditDateRange | null | undefined;
export type AuditAdvancedSearch = Record<string, AuditSearchValue>;

export type AuditExportValues = {
  date_range?: AuditDateRange;
  action?: string;
  resource_type?: string;
  username?: string;
  status?: string;
  risk_level?: string;
};

export type AuditRequestParams = {
  page: number;
  pageSize: number;
  searchField?: string;
  searchValue?: string;
  advancedSearch?: AuditAdvancedSearch;
  sorter?: { field: string; order: 'ascend' | 'descend' };
};

export type AuditApiParams = {
  page?: number;
  page_size?: number;
  category: AuditCategory;
  username?: string;
  search?: string;
  request_path?: string;
  action?: string;
  resource_type?: string;
  status?: string;
  risk_level?: string;
  created_after?: string;
  created_before?: string;
  exclude_action?: string;
  exclude_resource_type?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  [key: string]: string | number | undefined;
};
