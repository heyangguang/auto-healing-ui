jest.mock('@umijs/max', () => ({
  history: {
    location: { pathname: '/' },
    push: jest.fn(),
  },
  request: jest.fn(),
}));

jest.mock('antd', () => ({
  message: {
    warning: jest.fn(),
    error: jest.fn(),
  },
  notification: {
    open: jest.fn(),
  },
}));

const { errorConfig, __TEST_ONLY__, TokenManager } = require('./requestErrorConfig');
const { history: mockedHistory, request } = require('@umijs/max');
const { message } = require('antd');

describe('requestErrorConfig helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
    mockedHistory.location.pathname = '/';
    global.fetch = jest.fn();
  });

  it('stores remembered tokens in localStorage and clears session leftovers', () => {
    sessionStorage.setItem('auto_healing_token', 'stale-session');
    TokenManager.setRememberMe(true);
    TokenManager.setTokens('access-token', 'refresh-token');

    expect(localStorage.getItem('auto_healing_token')).toBe('access-token');
    expect(localStorage.getItem('auto_healing_refresh_token')).toBe('refresh-token');
    expect(sessionStorage.getItem('auto_healing_token')).toBeNull();
  });

  it('stores non-remembered tokens in sessionStorage and clears local leftovers', () => {
    localStorage.setItem('auto_healing_token', 'stale-local');
    TokenManager.setRememberMe(false);
    TokenManager.setTokens('access-token', 'refresh-token');

    expect(sessionStorage.getItem('auto_healing_token')).toBe('access-token');
    expect(sessionStorage.getItem('auto_healing_refresh_token')).toBe('refresh-token');
    expect(localStorage.getItem('auto_healing_token')).toBeNull();
  });

  it('parses JWT expiry from base64url payloads', () => {
    const exp = 1893456000;
    const token = `header.${Buffer.from(JSON.stringify({ exp, sub: 'user-1' })).toString('base64url')}.sig`;

    expect(__TEST_ONLY__.parseJwtExpiry(token)).toBe(exp * 1000);
    expect(__TEST_ONLY__.isTokenExpiringSoon(token)).toBe(false);
  });

  it('retries a 401 request only once after refresh succeeds', async () => {
    TokenManager.setTokens('old-access', 'refresh-token');
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ access_token: 'new-access', refresh_token: 'new-refresh' }),
    });
    (request as jest.Mock).mockResolvedValue({ data: [] });

    await errorConfig.errorConfig?.errorHandler?.({
      config: { headers: {}, url: '/api/v1/tenant/execution-tasks' },
      response: { status: 401 },
    });

    expect(request).toHaveBeenCalledWith('/api/v1/tenant/execution-tasks', expect.objectContaining({
      authRetryAttempted: true,
      headers: expect.objectContaining({
        Authorization: 'Bearer new-access',
      }),
      skipTokenRefresh: true,
    }));
  });

  it('stops retrying when a 401 comes back from an already retried request', async () => {
    TokenManager.setTokens('old-access', 'refresh-token');

    await errorConfig.errorConfig?.errorHandler?.({
      config: {
        authRetryAttempted: true,
        headers: {},
        url: '/api/v1/tenant/execution-tasks',
      },
      response: { status: 401 },
    });

    expect(request).not.toHaveBeenCalled();
    expect(message.error).toHaveBeenCalledWith(__TEST_ONLY__.LOGIN_EXPIRED_MESSAGE);
    expect(mockedHistory.push).toHaveBeenCalledWith('/user/login');
    expect(TokenManager.getToken()).toBeNull();
  });

  it('shows 403 errors unless the request explicitly suppresses them', async () => {
    await errorConfig.errorConfig?.errorHandler?.({
      config: { url: '/api/v1/tenant/plugins/plugin-1/sync' },
      response: { status: 403, data: { message: '没有插件同步权限' } },
    });

    expect(message.error).toHaveBeenCalledWith('没有插件同步权限');

    jest.clearAllMocks();

    await errorConfig.errorConfig?.errorHandler?.({
      config: {
        url: '/api/v1/tenant/site-messages/unread-count',
        suppressForbiddenError: true,
      },
      response: { status: 403, data: { message: '无权访问该资源' } },
    });

    expect(message.error).not.toHaveBeenCalled();
  });
});
