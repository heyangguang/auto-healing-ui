import type { SearchField } from '@/components/StandardTable';
import { getApprovalStatusOptions } from '@/constants/instanceDicts';
import type { ApprovalTableRequestParams } from './shared';

const HISTORY_STATUS_OPTIONS = getApprovalStatusOptions().filter((option) => option.value !== 'pending');

export const approvalHistorySearchFields: SearchField[] = [
  {
    key: '__enum__status',
    label: '审批状态',
    description: '筛选已处理审批状态',
    options: HISTORY_STATUS_OPTIONS,
  },
  { key: 'flow_instance_id', label: '流程实例', placeholder: '搜索流程实例 ID' },
];

export type ApprovalHistoryApiParams = {
  page: number;
  page_size: number;
  flow_instance_id?: string;
  status?: Exclude<AutoHealing.ApprovalStatus, 'pending'>;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
};

function normalizeHistorySearchField(field?: string) {
  return field?.replace(/^__enum__/, '');
}

export function buildApprovalHistoryParams(
  params: ApprovalTableRequestParams,
): ApprovalHistoryApiParams {
  const apiParams: ApprovalHistoryApiParams = {
    page: params.page,
    page_size: params.pageSize,
  };
  const normalizedField = normalizeHistorySearchField(params.searchField);

  if (normalizedField === 'status' && params.searchValue) {
    apiParams.status = params.searchValue as ApprovalHistoryApiParams['status'];
  }
  if (normalizedField === 'flow_instance_id' && params.searchValue) {
    apiParams.flow_instance_id = params.searchValue;
  }
  if (params.sorter) {
    apiParams.sort_by = params.sorter.field;
    apiParams.sort_order = params.sorter.order === 'ascend' ? 'asc' : 'desc';
  }

  return apiParams;
}

export function resolveApprovalActor(
  actorId: string | null | undefined,
  userMap: Record<string, string>,
) {
  if (!actorId) {
    return '-';
  }
  return userMap[actorId] || actorId;
}
