import dayjs from 'dayjs';
import {
  buildAuditExportParams,
  buildAuditListParams,
  getDeletedChangeEntries,
  getUpdatedChangeEntries,
} from './helpers';

describe('audit log helpers', () => {
  it('builds list params with search, filters and sorter', () => {
    expect(buildAuditListParams({
      page: 2,
      pageSize: 20,
      searchField: 'request_path',
      searchValue: '/api/v1/tenant/tasks',
      advancedSearch: {
        status: 'failed',
        created_at: [dayjs('2026-03-01'), dayjs('2026-03-02')],
        exclude_action: ['login', 'logout'],
      },
      sorter: { field: 'created_at', order: 'descend' },
    }, 'operation')).toEqual({
      page: 2,
      page_size: 20,
      category: 'operation',
      request_path: '/api/v1/tenant/tasks',
      status: 'failed',
      created_after: '2026-02-28T16:00:00.000Z',
      created_before: '2026-03-02T15:59:59.999Z',
      exclude_action: 'login,logout',
      sort_by: 'created_at',
      sort_order: 'desc',
    });
  });

  it('builds export params and keeps deleted/update change entries separate', () => {
    expect(buildAuditExportParams({
      username: 'ops',
      date_range: [dayjs('2026-03-03'), dayjs('2026-03-04')],
    }, 'login', 1, 1)).toEqual({
      category: 'login',
      page: 1,
      page_size: 1,
      username: 'ops',
      created_after: '2026-03-02T16:00:00.000Z',
      created_before: '2026-03-04T15:59:59.999Z',
    });

    const changes = {
      deleted: { path: '/tmp/file' },
      status: { old: 'pending', new: 'done' },
    };

    expect(getDeletedChangeEntries(changes)).toEqual([['path', '/tmp/file']]);
    expect(getUpdatedChangeEntries(changes)).toEqual([
      ['status', { old: 'pending', new: 'done' }],
    ]);
  });
});
