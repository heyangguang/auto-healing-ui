import {
  buildNotificationRecordsQuery,
  parseNestedJson,
} from './notificationRecordsConfig';
import { toDayRangeEndISO, toDayRangeStartISO } from '@/utils/dateRange';

describe('notification records config helpers', () => {
  it('maps table params into notification query params', () => {
    expect(buildNotificationRecordsQuery({
      page: 2,
      pageSize: 20,
      searchField: 'task_name',
      searchValue: 'backup',
      sorter: { field: 'created_at', order: 'descend' },
      advancedSearch: {
        status: 'failed',
        template_id: 'tpl-1',
        channel_id: 'channel-1',
        triggered_by: 'manual',
        created_at: ['2026-03-01', '2026-03-02'],
      },
    })).toEqual({
      page: 2,
      page_size: 20,
      task_name: 'backup',
      status: 'failed',
      template_id: 'tpl-1',
      channel_id: 'channel-1',
      triggered_by: 'manual',
      created_after: toDayRangeStartISO('2026-03-01'),
      created_before: toDayRangeEndISO('2026-03-02'),
      sort_by: 'created_at',
      sort_order: 'desc',
    });
  });

  it('parses nested json strings recursively', () => {
    expect(parseNestedJson('{"a":"{\\"b\\":1}","c":["{\\"d\\":2}"]}')).toEqual({
      a: { b: 1 },
      c: [{ d: 2 }],
    });
  });
});
