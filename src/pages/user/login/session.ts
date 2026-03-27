import { TokenManager } from '@/requestErrorConfig';

export const LEGACY_SAVED_LOGIN_KEY = 'auto_healing_saved_login';

export function getLoginInitialValues() {
  return { autoLogin: TokenManager.getRememberMe() };
}

export function persistLoginPreference(autoLogin: boolean) {
  TokenManager.setRememberMe(autoLogin);
  localStorage.removeItem(LEGACY_SAVED_LOGIN_KEY);
}
