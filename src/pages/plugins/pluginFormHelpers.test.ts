import {
  buildPluginConfig,
  buildPluginPayload,
  DEFAULT_PLUGIN_MAX_FAILURES,
  DEFAULT_PLUGIN_SYNC_INTERVAL_MINUTES,
  getPluginEditInitialValues,
  hasIncompletePluginFilter,
  shouldApplyPluginLogResponse,
} from './pluginFormHelpers';

describe('plugin form helpers', () => {
  it('reuses stored credentials when edit form leaves them blank', () => {
    expect(buildPluginConfig({
      auth_type: 'basic',
      name: 'plugin',
      type: 'itsm',
      url: 'https://example.com',
      username: '',
    }, {
      auth_type: 'basic',
      username: 'saved-user',
      password: 'saved-password',
    })).toEqual({
      auth_type: 'basic',
      url: 'https://example.com',
      username: 'saved-user',
      password: 'saved-password',
    });
  });

  it('keeps max_failures and supported filter operators in the payload', () => {
    expect(buildPluginPayload({
      values: {
        auth_type: 'api_key',
        max_failures: DEFAULT_PLUGIN_MAX_FAILURES,
        name: 'plugin',
        sync_interval_minutes: DEFAULT_PLUGIN_SYNC_INTERVAL_MINUTES,
        type: 'cmdb',
        url: 'https://example.com',
      },
      extraParams: [{ key: 'limit', value: '100' }],
      filters: [{ field: 'status', operator: 'in', value: 'active,offline' }],
      mappings: [{ standard: 'name', external: 'hostname' }],
      originalConfig: { auth_type: 'api_key', api_key: 'saved-api-key' },
    })).toEqual({
      name: 'plugin',
      type: 'cmdb',
      description: undefined,
      version: undefined,
      config: {
        auth_type: 'api_key',
        url: 'https://example.com',
        api_key: 'saved-api-key',
        extra_params: { limit: '100' },
      },
      field_mapping: { cmdb_mapping: { name: 'hostname' } },
      sync_filter: {
        logic: 'and',
        rules: [{ field: 'status', operator: 'in', value: ['active', 'offline'] }],
      },
      sync_enabled: false,
      sync_interval_minutes: DEFAULT_PLUGIN_SYNC_INTERVAL_MINUTES,
      max_failures: DEFAULT_PLUGIN_MAX_FAILURES,
    });
  });

  it('reuses the stored plugin max_failures when building edit initial values', () => {
    expect(getPluginEditInitialValues({
      id: 'plugin-1',
      name: 'Ops',
      type: 'itsm',
      description: 'desc',
      version: '1.0.0',
      status: 'active',
      config: { auth_type: 'basic', url: 'https://example.com' },
      field_mapping: {},
      sync_filter: { logic: 'and', rules: [] },
      sync_enabled: true,
      sync_interval_minutes: 30,
      max_failures: 7,
      last_sync_at: '',
      next_sync_at: '',
      created_at: '',
    } as any)).toMatchObject({
      max_failures: 7,
      sync_interval_minutes: 30,
    });
  });

  it('falls back to the backend default max_failures when the field is omitted', () => {
    expect(buildPluginPayload({
      values: {
        auth_type: 'basic',
        name: 'plugin',
        type: 'itsm',
        url: 'https://example.com',
        username: 'ops',
      },
      extraParams: [],
      filters: [],
      mappings: [],
    }).max_failures).toBe(DEFAULT_PLUGIN_MAX_FAILURES);

    expect(getPluginEditInitialValues({
      id: 'plugin-1',
      name: 'Ops',
      type: 'itsm',
      status: 'active',
      config: { auth_type: 'basic', url: 'https://example.com' },
      field_mapping: {},
      sync_filter: { logic: 'and', rules: [] },
      sync_enabled: true,
      created_at: '',
    } as any).max_failures).toBe(DEFAULT_PLUGIN_MAX_FAILURES);
  });

  it('flags incomplete filters instead of silently persisting them', () => {
    expect(hasIncompletePluginFilter([
      { field: 'status', operator: 'equals', value: '' },
    ])).toBe(true);
    expect(hasIncompletePluginFilter([
      { field: '', operator: 'equals', value: '' },
    ])).toBe(false);
  });

  it('guards against stale plugin log responses', () => {
    expect(shouldApplyPluginLogResponse({
      requestId: 3,
      latestRequestId: 3,
      pluginId: 'plugin-2',
      currentPluginId: 'plugin-2',
    })).toBe(true);
    expect(shouldApplyPluginLogResponse({
      requestId: 2,
      latestRequestId: 3,
      pluginId: 'plugin-1',
      currentPluginId: 'plugin-2',
    })).toBe(false);
  });
});
