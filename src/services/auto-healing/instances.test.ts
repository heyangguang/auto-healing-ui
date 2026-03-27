import {
  getHealingInstanceDetail,
  getHealingInstances,
} from './instances';
import {
  getTenantHealingInstances,
  getTenantHealingInstancesId,
} from '@/services/generated/auto-healing/flowInstances';

jest.mock('@/services/generated/auto-healing/flowInstances', () => ({
  getTenantHealingInstances: jest.fn(),
  getTenantHealingInstancesId: jest.fn(),
}));

describe('auto-healing instances service', () => {
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
});
