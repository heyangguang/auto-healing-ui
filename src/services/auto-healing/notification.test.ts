import {
  createChannel,
  createTemplate,
  deleteChannel,
  deleteTemplate,
  getChannel,
  getNotification,
  getNotificationStats,
  getChannels,
  getTemplate,
  getTemplateVariables,
  getNotifications,
  getTemplates,
  previewTemplate,
  sendNotification,
  testChannel,
  updateChannel,
  updateTemplate,
} from './notification';
import { request } from '@umijs/max';

jest.mock('@umijs/max', () => ({
  request: jest.fn(),
}));

describe('auto-healing notification service', () => {
  it('normalizes notification list wrappers against request responses', async () => {
    (request as jest.Mock)
      .mockResolvedValueOnce({
      data: [{ id: 'channel-1', name: 'Ops Mail' }],
      total: 1,
      page: 1,
      page_size: 20,
    })
      .mockResolvedValueOnce({ data: { id: 'channel-1' } })
      .mockResolvedValueOnce({
      data: [{ id: 'tpl-1', name: 'Deploy Template' }],
      total: 1,
      page: 2,
      page_size: 10,
    })
      .mockResolvedValueOnce({ data: { id: 'tpl-1' } })
      .mockResolvedValueOnce({
      data: [{ id: 'log-1', subject: 'Deploy' }],
      total: 1,
      page: 3,
      page_size: 50,
    });

    await expect(getChannels({ page: 1, page_size: 20, type: 'email', name: 'ops' })).resolves.toEqual({
      data: [{ id: 'channel-1', name: 'Ops Mail' }],
      total: 1,
      page: 1,
      page_size: 20,
    });
    await createChannel({} as AutoHealing.CreateChannelRequest);
    await expect(getTemplates({ page: 2, page_size: 10, name: 'default', format: 'markdown' })).resolves.toEqual({
      data: [{ id: 'tpl-1', name: 'Deploy Template' }],
      total: 1,
      page: 2,
      page_size: 10,
    });
    await createTemplate({} as AutoHealing.CreateTemplateRequest);
    await expect(getNotifications({ page: 3, page_size: 50, status: 'sent', subject: 'deploy' })).resolves.toEqual({
      data: [{ id: 'log-1', subject: 'Deploy' }],
      total: 1,
      page: 3,
      page_size: 50,
    });

    expect(request).toHaveBeenNthCalledWith(1, '/api/v1/tenant/channels', {
      method: 'GET',
      params: { page: 1, page_size: 20, type: 'email', name: 'ops' },
    });
    expect(request).toHaveBeenNthCalledWith(2, '/api/v1/tenant/channels', {
      method: 'POST',
      data: {},
    });
    expect(request).toHaveBeenNthCalledWith(3, '/api/v1/tenant/templates', {
      method: 'GET',
      params: { page: 2, page_size: 10, name: 'default', format: 'markdown' },
    });
    expect(request).toHaveBeenNthCalledWith(4, '/api/v1/tenant/templates', {
      method: 'POST',
      data: {},
    });
    expect(request).toHaveBeenNthCalledWith(5, '/api/v1/tenant/notifications', {
      method: 'GET',
      params: {
        page: 3,
        page_size: 50,
        status: 'sent',
        subject: 'deploy',
      },
    });
  });

  it('unwraps request-based notification helpers to stable shapes', async () => {
    (request as jest.Mock)
      .mockResolvedValueOnce({ data: { id: 'channel-1', name: 'Ops Mail' } })
      .mockResolvedValueOnce({ data: { id: 'tpl-1', name: 'Deploy Template' } })
      .mockResolvedValueOnce({ data: [{ name: 'task.name', category: 'task', description: '任务名' }] })
      .mockResolvedValueOnce({ data: { id: 'log-1', subject: 'Deploy' } })
      .mockResolvedValueOnce({
        data: {
          channels_total: 2,
          channels_by_type: [{ type: 'email', count: 1 }],
          logs_total: 8,
          logs_by_status: [{ status: 'sent', count: 6 }],
          templates_total: 3,
          templates_active: 2,
        },
      });

    await expect(getChannel('channel-1')).resolves.toEqual({ id: 'channel-1', name: 'Ops Mail' });
    await expect(getTemplate('tpl-1')).resolves.toEqual({ id: 'tpl-1', name: 'Deploy Template' });
    await expect(getTemplateVariables()).resolves.toEqual([
      { name: 'task.name', category: 'task', description: '任务名' },
    ]);
    await expect(getNotification('log-1')).resolves.toEqual({ id: 'log-1', subject: 'Deploy' });
    await expect(getNotificationStats()).resolves.toEqual({
      channels_total: 2,
      channels_by_type: [{ type: 'email', count: 1 }],
      logs_total: 8,
      logs_by_status: [{ status: 'sent', count: 6 }],
      templates_total: 3,
      templates_active: 2,
    });
  });

  it('forwards notification mutations to the expected request endpoints', async () => {
    (request as jest.Mock)
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValueOnce({ subject: 'Preview', body: 'Body' })
      .mockResolvedValueOnce({ sent_count: 1, failed_count: 0, results: [] })
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValueOnce({ ok: true });

    await updateChannel('channel-1', { name: 'Ops' } as AutoHealing.UpdateChannelRequest);
    await deleteChannel('channel-1');
    await testChannel('channel-1');
    await expect(previewTemplate('tpl-1', { variables: { task: { name: 'demo' } } })).resolves.toEqual({
      subject: 'Preview',
      body: 'Body',
    });
    await expect(sendNotification({
      channel_ids: ['channel-1'],
      subject: 'Deploy',
      body: 'Done',
    })).resolves.toEqual({ sent_count: 1, failed_count: 0, results: [] });
    await updateTemplate('tpl-1', { name: 'Template' } as AutoHealing.UpdateTemplateRequest);
    await deleteTemplate('tpl-1');

    expect(request).toHaveBeenNthCalledWith(1, '/api/v1/tenant/channels/channel-1', {
      method: 'PUT',
      data: { name: 'Ops' },
    });
    expect(request).toHaveBeenNthCalledWith(2, '/api/v1/tenant/channels/channel-1', {
      method: 'DELETE',
    });
    expect(request).toHaveBeenNthCalledWith(3, '/api/v1/tenant/channels/channel-1/test', {
      method: 'POST',
    });
    expect(request).toHaveBeenNthCalledWith(4, '/api/v1/tenant/templates/tpl-1/preview', {
      method: 'POST',
      data: { variables: { task: { name: 'demo' } } },
    });
    expect(request).toHaveBeenNthCalledWith(5, '/api/v1/tenant/notifications/send', {
      method: 'POST',
      data: { channel_ids: ['channel-1'], subject: 'Deploy', body: 'Done' },
    });
    expect(request).toHaveBeenNthCalledWith(6, '/api/v1/tenant/templates/tpl-1', {
      method: 'PUT',
      data: { name: 'Template' },
    });
    expect(request).toHaveBeenNthCalledWith(7, '/api/v1/tenant/templates/tpl-1', {
      method: 'DELETE',
    });
  });
});
