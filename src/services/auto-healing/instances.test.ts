import {
  getHealingInstanceRecoveryLogs,
  getHealingInstanceDetail,
  getHealingInstances,
  recoverHealingInstance,
} from './instances';
import { request } from '@umijs/max';
import {
  getTenantHealingInstances,
  getTenantHealingInstancesId,
} from '@/services/generated/auto-healing/flowInstances';

jest.mock('@umijs/max', () => ({
  request: jest.fn(),
}));

jest.mock('@/services/generated/auto-healing/flowInstances', () => ({
  getTenantHealingInstances: jest.fn(),
  getTenantHealingInstancesId: jest.fn(),
}));

describe('auto-healing instances service', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('delegates stable flow-instance wrappers to the generated flow-instances client', async () => {
    await getHealingInstances({ page: 1, page_size: 20, status: 'running' });
    await getHealingInstanceDetail('instance-1');

    expect(getTenantHealingInstances).toHaveBeenCalledWith({
      page: 1,
      page_size: 20,
      status: 'running',
    }, undefined);
    expect(getTenantHealingInstancesId).toHaveBeenCalledWith({ id: 'instance-1' }, undefined);
  });

  it('calls tenant recovery endpoints through request wrappers', async () => {
    (request as jest.Mock)
      .mockResolvedValueOnce({ data: [{ id: 'recovery-1', status: 'success' }] })
      .mockResolvedValueOnce({ message: '流程实例正在恢复' });

    await getHealingInstanceRecoveryLogs('instance-1');
    await recoverHealingInstance('instance-1');

    expect(request).toHaveBeenNthCalledWith(1, '/api/v1/tenant/healing/instances/instance-1/recovery-logs', {
      method: 'GET',
    });
    expect(request).toHaveBeenNthCalledWith(2, '/api/v1/tenant/healing/instances/instance-1/recover', {
      method: 'POST',
    });
  });
});
