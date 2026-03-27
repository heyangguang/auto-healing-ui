import { TokenManager } from '@/requestErrorConfig';
import { getLoginInitialValues, LEGACY_SAVED_LOGIN_KEY, persistLoginPreference } from './session';

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

  it('persists remember-me preference and clears legacy saved passwords', () => {
    localStorage.setItem(LEGACY_SAVED_LOGIN_KEY, 'legacy-secret');

    persistLoginPreference(true);

    expect(TokenManager.setRememberMe).toHaveBeenCalledWith(true);
    expect(localStorage.getItem(LEGACY_SAVED_LOGIN_KEY)).toBeNull();
  });
});
