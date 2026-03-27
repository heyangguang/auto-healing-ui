import {
  buildPreviewTemplateVariables,
  buildTemplateFilterParams,
  parseTemplateSearchParams,
} from './notificationTemplateHelpers';

describe('notification template helpers', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('builds current preview variables on each invocation', () => {
    const spy = jest
      .spyOn(Date.prototype, 'toLocaleString')
      .mockReturnValueOnce('time-1')
      .mockReturnValueOnce('time-2');

    expect(buildPreviewTemplateVariables().timestamp).toBe('time-1');
    expect(buildPreviewTemplateVariables().timestamp).toBe('time-2');
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('maps search filters into query state', () => {
    expect(parseTemplateSearchParams({
      filters: [
        { field: 'name', value: 'deploy' },
        { field: '__enum__event_type', value: 'execution_started' },
        { field: 'status', value: 'inactive' },
        { field: 'format', value: 'markdown' },
        { field: 'supported_channel', value: 'email' },
      ],
    })).toEqual({
      searchText: 'deploy',
      filterEventType: 'execution_started',
      filterStatus: 'inactive',
      filterFormat: 'markdown',
      filterChannel: 'email',
    });
  });

  it('builds template query params only for supported filters', () => {
    expect(buildTemplateFilterParams({
      filterChannel: 'email',
      filterEventType: 'execution_result',
      filterFormat: 'markdown',
      filterStatus: 'inactive',
      searchText: ' ops ',
      sortBy: 'updated_at',
      sortOrder: 'desc',
      pageSize: 20,
    })).toEqual({
      page_size: 20,
      name: 'ops',
      event_type: 'execution_result',
      is_active: false,
      format: 'markdown',
      supported_channel: 'email',
      sort_by: 'updated_at',
      sort_order: 'desc',
    });
  });
});
