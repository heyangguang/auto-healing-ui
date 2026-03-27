import {
  applyImpersonationTableRequest,
  buildImpersonationListParams,
  type ImpersonationTableRequestParams,
} from './impersonationShared';
import type { ImpersonationRequest } from '@/services/auto-healing/platform/impersonation';

const baseParams: ImpersonationTableRequestParams = {
  page: 1,
  pageSize: 10,
};

const mockItems: ImpersonationRequest[] = [
  {
    id: 'req-1',
    requester_id: 'user-1',
    requester_name: 'Alice',
    tenant_id: 'tenant-1',
    tenant_name: 'Tenant A',
    duration_minutes: 60,
    status: 'approved',
    created_at: '2026-03-27T00:00:00Z',
    updated_at: '2026-03-27T00:00:00Z',
  },
  {
    id: 'req-2',
    requester_id: 'user-2',
    requester_name: 'Bob',
    tenant_id: 'tenant-2',
    tenant_name: 'Tenant B',
    duration_minutes: 30,
    status: 'pending',
    created_at: '2026-03-27T00:00:00Z',
    updated_at: '2026-03-27T00:00:00Z',
  },
];

describe('impersonationShared helpers', () => {
  it('maps quick enum status search to the real status param', () => {
    expect(buildImpersonationListParams({
      ...baseParams,
      searchField: '__enum__status',
      searchValue: 'approved',
    })).toEqual({
      page: 1,
      page_size: 10,
      status: 'approved',
    });
  });

  it('filters local impersonation items by quick enum status', () => {
    expect(applyImpersonationTableRequest(mockItems, {
      ...baseParams,
      searchField: '__enum__status',
      searchValue: 'approved',
    })).toEqual({
      data: [mockItems[0]],
      total: 1,
    });
  });
});
