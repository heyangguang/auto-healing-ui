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

const { __TEST_ONLY__, TokenManager } = require('./requestErrorConfig');

describe('requestErrorConfig helpers', () => {
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
});
