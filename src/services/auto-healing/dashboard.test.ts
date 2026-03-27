import { getDashboardOverview } from './dashboard';
import { getTenantDashboardOverview } from '@/services/generated/auto-healing/dashboard';

jest.mock('@/services/generated/auto-healing/dashboard', () => ({
  getTenantDashboardOverview: jest.fn(),
}));

describe('auto-healing dashboard service', () => {
  it('delegates dashboard overview to the generated dashboard client', async () => {
    await getDashboardOverview(['overview', 'incidents']);

    expect(getTenantDashboardOverview).toHaveBeenCalledWith({
      params: { sections: 'overview,incidents' },
      skipErrorHandler: true,
    });
  });
});
