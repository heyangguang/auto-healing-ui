import { TokenManager } from '@/requestErrorConfig';

export const LEGACY_SAVED_LOGIN_KEY = 'auto_healing_saved_login';

export type DemoLoginAccount = 'tenant';

export const DEMO_LOGIN_ACCOUNTS: Record<
  DemoLoginAccount,
  { username: string; password: string }
> = {
  tenant: {
    username: 'e2eadmin',
    password: 'Tenant123456!',
  },
};

export type DemoLoginParams = {
  account?: DemoLoginAccount;
  redirect?: string;
};

function isDemoLoginAccount(value: string | null): value is DemoLoginAccount {
  return value === 'tenant';
}

export function sanitizeLoginRedirect(value: string | null) {
  if (
    !value ||
    !value.startsWith('/') ||
    value.startsWith('//') ||
    /[\r\n]/.test(value)
  ) {
    return undefined;
  }
  return value;
}

export function getDemoLoginParams(
  search = globalThis.location?.search || '',
): DemoLoginParams {
  const params = new URLSearchParams(search);
  const demo = params.get('demo');
  const result: DemoLoginParams = {};
  if (isDemoLoginAccount(demo)) {
    result.account = demo;
  }
  const redirect = sanitizeLoginRedirect(params.get('redirect'));
  if (redirect) {
    result.redirect = redirect;
  }
  return result;
}

export function getLoginInitialValues(account?: DemoLoginAccount) {
  const base = { autoLogin: TokenManager.getRememberMe() };
  if (!account) return base;
  return {
    ...base,
    ...DEMO_LOGIN_ACCOUNTS[account],
    autoLogin: true,
  };
}

export function persistLoginPreference(autoLogin: boolean) {
  TokenManager.setRememberMe(autoLogin);
  localStorage.removeItem(LEGACY_SAVED_LOGIN_KEY);
}
