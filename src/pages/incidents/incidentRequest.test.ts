import { buildIncidentApiParams } from './incidentRequest';

describe('buildIncidentApiParams', () => {
  it('maps enum search fields to incident query params', () => {
    expect(
      buildIncidentApiParams({
        page: 3,
        pageSize: 10,
        searchField: '__enum__scanned',
        searchValue: 'false',
        sorter: { field: 'created_at', order: 'ascend' },
      }),
    ).toEqual({
      page: 3,
      page_size: 10,
      scanned: false,
      sort_by: 'created_at',
      sort_order: 'asc',
    });

    expect(
      buildIncidentApiParams({
        page: 1,
        pageSize: 20,
        searchField: '__enum__severity',
        searchValue: 'critical',
      }),
    ).toEqual({
      page: 1,
      page_size: 20,
      severity: 'critical',
    });
  });

  it('maps advanced search exact fields and booleans', () => {
    expect(
      buildIncidentApiParams({
        page: 1,
        pageSize: 20,
        advancedSearch: {
          title__exact: '磁盘空间不足告警',
          external_id__exact: 'INC-1001',
          source_plugin_name__exact: 'itsm',
          status: 'open',
          healing_status: 'pending',
          scanned: 'true',
          has_plugin: 'false',
        },
      }),
    ).toEqual({
      page: 1,
      page_size: 20,
      title__exact: '磁盘空间不足告警',
      external_id__exact: 'INC-1001',
      source_plugin_name__exact: 'itsm',
      status: 'open',
      healing_status: 'pending',
      scanned: true,
      has_plugin: false,
    });
  });
});
