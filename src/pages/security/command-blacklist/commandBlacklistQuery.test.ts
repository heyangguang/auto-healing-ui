import {
  buildCommandBlacklistQuery,
  buildCommandBlacklistRequestSignature,
} from './commandBlacklistQuery';

describe('commandBlacklistQuery', () => {
  it('maps table params into blacklist api params', () => {
    expect(buildCommandBlacklistQuery({
      page: 2,
      pageSize: 20,
      searchValue: '危险命令',
      advancedSearch: {
        pattern: 'rm -rf',
        severity: 'critical',
        is_active: 'true',
      },
      sorter: { field: 'updated_at', order: 'descend' },
    })).toEqual({
      page: 2,
      page_size: 20,
      name: '危险命令',
      pattern: 'rm -rf',
      severity: 'critical',
      is_active: 'true',
      sort_by: 'updated_at',
      sort_order: 'desc',
    });
  });

  it('builds different signatures for different visible result sets', () => {
    const first = buildCommandBlacklistRequestSignature({
      page: 1,
      pageSize: 20,
      searchValue: '危险命令',
    });
    const second = buildCommandBlacklistRequestSignature({
      page: 2,
      pageSize: 20,
      searchValue: '危险命令',
    });

    expect(first).not.toBe(second);
  });
});
