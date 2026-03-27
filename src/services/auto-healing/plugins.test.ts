import {
  createPlugin,
  deletePlugin,
  getPlugin,
  getPlugins,
  syncPlugin,
  updatePlugin,
} from './plugins';
import {
  deleteTenantPluginsId,
  getTenantPlugins,
  getTenantPluginsId,
  postTenantPlugins,
  postTenantPluginsIdSync,
  putTenantPluginsId,
} from '@/services/generated/auto-healing/plugins';

jest.mock('@/services/generated/auto-healing/plugins', () => ({
  getTenantPlugins: jest.fn(),
  getTenantPluginsId: jest.fn(),
  postTenantPlugins: jest.fn(),
  putTenantPluginsId: jest.fn(),
  deleteTenantPluginsId: jest.fn(),
  postTenantPluginsIdSync: jest.fn(),
}));

describe('auto-healing plugins service', () => {
  it('delegates core CRUD and sync endpoints to the generated plugins client', async () => {
    await getPlugins({ page: 2, page_size: 50, type: 'cmdb', status: 'active' });
    await getPlugin('plugin-1');
    await createPlugin({} as AutoHealing.CreatePluginRequest);
    await updatePlugin('plugin-1', {} as AutoHealing.UpdatePluginRequest);
    await deletePlugin('plugin-1');
    await syncPlugin('plugin-1');

    expect(getTenantPlugins).toHaveBeenCalledWith({
      page: 2,
      page_size: 50,
      type: 'cmdb',
      status: 'active',
    });
    expect(getTenantPluginsId).toHaveBeenCalledWith({ id: 'plugin-1' });
    expect(postTenantPlugins).toHaveBeenCalledWith({ data: {} });
    expect(putTenantPluginsId).toHaveBeenCalledWith({ id: 'plugin-1' }, { data: {} });
    expect(deleteTenantPluginsId).toHaveBeenCalledWith({ id: 'plugin-1' });
    expect(postTenantPluginsIdSync).toHaveBeenCalledWith({ id: 'plugin-1' });
  });
});
