jest.mock('@/constants/auditDicts', () => ({
  ACTION_VERBS: {},
  ALL_RESOURCE_LABELS: {},
}));

import { loadProfileSidebarData, parseUA } from './profileHelpers';

describe('profileHelpers', () => {
  it('prefers mobile OS detection over desktop tokens in user agent', () => {
    expect(parseUA('Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 Safari/604.1'))
      .toContain('iOS');
    expect(parseUA('Mozilla/5.0 (Linux; Android 14; Pixel 9) AppleWebKit/537.36 Chrome/123.0.0.0 Mobile Safari/537.36'))
      .toContain('Android');
  });

  it('preserves login history when activity loading fails', async () => {
    const result = await loadProfileSidebarData({
      loadActivities: async () => {
        throw new Error('tenant context missing');
      },
      loadLoginHistory: async () => ({
        data: [{ id: 'login-1', created_at: '2026-03-27T00:00:00Z' }],
        total: 1,
        page: 1,
        page_size: 1,
      }),
    });

    expect(result.loginLogs).toEqual([{ id: 'login-1', created_at: '2026-03-27T00:00:00Z' }]);
    expect(result.opLogs).toEqual([]);
    expect(result.activitiesFailed).toBe(true);
  });
});
