import { buildCMDBQueryParams } from './cmdbRequest';

describe('buildCMDBQueryParams', () => {
  it('maps enum search fields to CMDB query params', () => {
    expect(
      buildCMDBQueryParams({
        page: 2,
        pageSize: 50,
        searchField: '__enum__status',
        searchValue: 'maintenance',
        sorter: { field: 'updated_at', order: 'descend' },
      }),
    ).toEqual({
      page: 2,
      page_size: 50,
      status: 'maintenance',
      sort_by: 'updated_at',
      sort_order: 'desc',
    });

    expect(
      buildCMDBQueryParams({
        page: 1,
        pageSize: 20,
        searchField: '__enum__environment',
        searchValue: 'production',
      }),
    ).toEqual({
      page: 1,
      page_size: 20,
      environment: 'production',
    });
  });

  it('normalizes advanced search values and booleans', () => {
    expect(
      buildCMDBQueryParams({
        page: 1,
        pageSize: 20,
        advancedSearch: {
          name__exact: 'db-prod-01',
          status: 'online',
          type: 'server',
          environment: 'production',
          has_plugin: 'false',
          source_plugin_name__exact: 'cmdb-sync',
        },
      }),
    ).toEqual({
      page: 1,
      page_size: 20,
      name__exact: 'db-prod-01',
      status: 'active',
      type: 'server',
      environment: 'production',
      has_plugin: false,
      source_plugin_name__exact: 'cmdb-sync',
    });
  });
});
