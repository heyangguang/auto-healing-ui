import {
  changePassword,
  getCurrentUser,
  getProfile,
  getProfileActivities,
  getProfileLoginHistory,
  login,
  refreshToken,
  updateProfile,
} from './auth';
import { request } from '@umijs/max';
import {
  getAuthMe,
  getAuthProfile,
  postAuthLogin,
  postAuthRefresh,
  putAuthPassword,
  putAuthProfile,
} from '@/services/generated/auto-healing/authentication';

jest.mock('@umijs/max', () => ({
  request: jest.fn(),
}));

jest.mock('@/services/generated/auto-healing/authentication', () => ({
  postAuthLogin: jest.fn(),
  postAuthRefresh: jest.fn(),
  getAuthMe: jest.fn(),
  putAuthPassword: jest.fn(),
  getAuthProfile: jest.fn(),
  putAuthProfile: jest.fn(),
}));

describe('auto-healing auth service', () => {
  it('delegates stable endpoints to the generated authentication client', async () => {
    (getAuthMe as jest.Mock).mockResolvedValue({ data: { id: 'user-2', username: 'ops' } });
    (getAuthProfile as jest.Mock).mockResolvedValue({ data: { id: 'user-1' } });
    (request as jest.Mock)
      .mockResolvedValueOnce({ data: { items: [{ id: 'login-1' }], total: 1 } })
      .mockResolvedValueOnce({ data: { items: [{ id: 'activity-1' }], total: 1 } });

    await login({ username: 'ops', password: 'secret' });
    await refreshToken({ refresh_token: 'refresh-token' });
    await expect(getCurrentUser({ skipErrorHandler: true })).resolves.toEqual({ id: 'user-2', username: 'ops' });
    await changePassword({ old_password: 'old', new_password: 'new' });
    await expect(getProfile()).resolves.toEqual({ id: 'user-1' });
    await expect(getProfileLoginHistory()).resolves.toEqual({
      data: [{ id: 'login-1' }],
      total: 1,
      page: 1,
      page_size: 1,
    });
    await expect(getProfileActivities()).resolves.toEqual({
      data: [{ id: 'activity-1' }],
      total: 1,
      page: 1,
      page_size: 1,
    });
    await updateProfile({ display_name: 'Ops' });

    expect(postAuthLogin).toHaveBeenCalledWith(
      { username: 'ops', password: 'secret' },
      { skipErrorHandler: true },
    );
    expect(postAuthRefresh).toHaveBeenCalledWith({ refresh_token: 'refresh-token' });
    expect(getAuthMe).toHaveBeenCalledWith({ skipErrorHandler: true });
    expect(putAuthPassword).toHaveBeenCalledWith({ old_password: 'old', new_password: 'new' });
    expect(getAuthProfile).toHaveBeenCalledWith();
    expect(request).toHaveBeenNthCalledWith(1, '/api/v1/auth/profile/login-history', {
      method: 'GET',
      params: { limit: 10 },
    });
    expect(request).toHaveBeenNthCalledWith(2, '/api/v1/auth/profile/activities', {
      method: 'GET',
      params: { limit: 15 },
    });
    expect(putAuthProfile).toHaveBeenCalledWith({ display_name: 'Ops' });
  });
});
