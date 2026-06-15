import { TokenManager } from '@/requestErrorConfig';
import {
  getDemoLoginParams,
  getLoginInitialValues,
  LEGACY_SAVED_LOGIN_KEY,
  persistLoginPreference,
  sanitizeLoginRedirect,
} from './session';

jest.mock('@/requestErrorConfig', () => ({
  TokenManager: {
    getRememberMe: jest.fn(() => false),
    setRememberMe: jest.fn(),
  },
}));

describe('login session helpers', () => {
  it('reads remember-me state for the form initial values', () => {
    (TokenManager.getRememberMe as jest.Mock).mockReturnValue(true);

    expect(getLoginInitialValues()).toEqual({ autoLogin: true });
  });

  it('prefills the tenant demo login account when requested', () => {
    (TokenManager.getRememberMe as jest.Mock).mockReturnValue(false);

    expect(getLoginInitialValues('tenant')).toEqual({
      username: 'e2eadmin',
      password: 'Tenant123456!',
      autoLogin: true,
    });
  });

  it('parses demo login params and keeps same-origin redirects only', () => {
    expect(
      getDemoLoginParams('?demo=tenant&redirect=%2Fresources%2Fincidents'),
    ).toEqual({
      account: 'tenant',
      redirect: '/resources/incidents',
    });
    expect(
      getDemoLoginParams('?demo=unknown&redirect=https%3A%2F%2Fevil.example'),
    ).toEqual({});
  });

  it('rejects unsafe login redirects', () => {
    expect(sanitizeLoginRedirect('/execution/runs')).toBe('/execution/runs');
    expect(sanitizeLoginRedirect('//evil.example')).toBeUndefined();
    expect(sanitizeLoginRedirect('https://evil.example')).toBeUndefined();
    expect(
      sanitizeLoginRedirect('/ok\nLocation: //evil.example'),
    ).toBeUndefined();
  });

  it('persists remember-me preference and clears legacy saved passwords', () => {
    localStorage.setItem(LEGACY_SAVED_LOGIN_KEY, 'legacy-secret');

    persistLoginPreference(true);

    expect(TokenManager.setRememberMe).toHaveBeenCalledWith(true);
    expect(localStorage.getItem(LEGACY_SAVED_LOGIN_KEY)).toBeNull();
  });
});
