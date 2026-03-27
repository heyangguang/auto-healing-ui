import { buildTriggerApiParams } from './triggers';
import { buildExemptionHistoryApiParams } from './exemption-approvals';
import { buildPendingTriggerParams } from './shared';

describe('pending-center request builders', () => {
  it('maps trigger date range and quick search into API params', () => {
    expect(buildTriggerApiParams({
      page: 2,
      pageSize: 20,
      searchValue: 'db-alert',
      advancedSearch: {
        severity: 'critical',
        created_at: ['2026-03-01', '2026-03-05'],
      },
      sorter: { field: 'created_at', order: 'descend' },
    })).toEqual({
      page: 2,
      page_size: 20,
      title: 'db-alert',
      severity: 'critical',
      date_from: '2026-03-01',
      date_to: '2026-03-05',
      sort_by: 'created_at',
      sort_order: 'desc',
    });
  });

  it('maps exemption quick enum status search to the real status param', () => {
    expect(buildExemptionHistoryApiParams({
      page: 1,
      pageSize: 10,
      searchField: '__enum__status',
      searchValue: 'approved',
    })).toEqual({
      page: 1,
      page_size: 10,
      status: 'approved',
    });
  });

  it('maps trigger header filter to severity instead of polluting title search', () => {
    expect(buildTriggerApiParams({
      page: 1,
      pageSize: 20,
      searchField: 'severity',
      searchValue: 'critical',
    })).toEqual({
      page: 1,
      page_size: 20,
      severity: 'critical',
    });

    expect(buildPendingTriggerParams({
      page: 1,
      pageSize: 20,
      searchField: 'severity',
      searchValue: 'critical',
    })).toEqual({
      page: 1,
      page_size: 20,
      severity: 'critical',
    });
  });
});
