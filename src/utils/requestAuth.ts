import { hasActiveImpersonationSession } from './tenantContext';

const TOKEN_KEY = 'auto_healing_token';
const REFRESH_TOKEN_KEY = 'auto_healing_refresh_token';
const REMEMBER_KEY = 'auto_healing_remember';

type TenantSummary = { id: string };
type TenantStorageState = {
  currentTenantId?: string;
  tenants?: TenantSummary[];
};
type RefreshTokenResponse = {
  access_token?: string;
  refresh_token?: string;
  tenants?: TenantSummary[];
  current_tenant_id?: string;
};

type ResponseHeaders =
  | Headers
  | Record<string, string | undefined>
  | { get?: (name: string) => string | null }
  | undefined;

const getStorage = (): Storage => (
  localStorage.getItem(REMEMBER_KEY) === 'true' ? localStorage : sessionStorage
);

const getStoredValue = (key: string): string | null => (
  getStorage().getItem(key) || localStorage.getItem(key) || sessionStorage.getItem(key)
);

let cachedTokenExpiry: { token: string; expiry: number | null } | null = null;
let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

export const TokenManager = {
  getToken: () => getStoredValue(TOKEN_KEY),
  getRefreshToken: () => getStoredValue(REFRESH_TOKEN_KEY),
  setTokens: (accessToken: string, refreshToken?: string) => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(REFRESH_TOKEN_KEY);
    const storage = getStorage();
    storage.setItem(TOKEN_KEY, accessToken);
    if (refreshToken) {
      storage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
    cachedTokenExpiry = null;
  },
  clearTokens: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(REMEMBER_KEY);
    localStorage.removeItem('tenant-storage');
    localStorage.removeItem('is-platform-admin');
    localStorage.removeItem('impersonation-storage');
    localStorage.removeItem('auto_healing_saved_login');
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(REFRESH_TOKEN_KEY);
    cachedTokenExpiry = null;
  },
  setRememberMe: (remember: boolean) => {
    if (remember) {
      localStorage.setItem(REMEMBER_KEY, 'true');
      return;
    }
    localStorage.removeItem(REMEMBER_KEY);
  },
  getRememberMe: () => localStorage.getItem(REMEMBER_KEY) === 'true',
};

export const parseJwtExpiry = (token: string): number | null => {
  try {
    const payloadBase64 = token.split('.')[1];
    if (!payloadBase64) {
      return null;
    }
    const normalizedPayload = payloadBase64
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      .padEnd(Math.ceil(payloadBase64.length / 4) * 4, '=');
    const payload = JSON.parse(atob(normalizedPayload));
    return payload.exp ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
};

export const isTokenExpiringSoon = (token: string): boolean => {
  const expiry = cachedTokenExpiry?.token === token
    ? cachedTokenExpiry.expiry
    : parseJwtExpiry(token);
  cachedTokenExpiry = { token, expiry };
  if (!expiry) {
    return true;
  }
  return Date.now() >= expiry - 5 * 60 * 1000;
};

async function doRefreshToken(): Promise<string | null> {
  const refreshTokenValue = TokenManager.getRefreshToken();
  if (!refreshTokenValue) {
    return null;
  }

  try {
    const response = await fetch('/api/v1/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshTokenValue }),
    });
    if (!response.ok) {
      return null;
    }

    const data = await response.json() as RefreshTokenResponse;
    if (!data.access_token) {
      return null;
    }

    TokenManager.setTokens(data.access_token, data.refresh_token);
    const isPlatformAdmin = localStorage.getItem('is-platform-admin') === 'true';
    const isImpersonating = hasActiveImpersonationSession();
    if (!isPlatformAdmin && data.tenants) {
      const existingRaw = localStorage.getItem('tenant-storage');
      let preservedTenantId = data.current_tenant_id;
      if (existingRaw) {
        try {
          const existing = JSON.parse(existingRaw) as TenantStorageState;
          if (existing.currentTenantId && data.tenants.some((tenant) => tenant.id === existing.currentTenantId)) {
            preservedTenantId = existing.currentTenantId;
          }
        } catch {
          /* noop */
        }
      }
      localStorage.setItem('tenant-storage', JSON.stringify({
        currentTenantId: preservedTenantId,
        tenants: data.tenants,
      }));
    } else if (isPlatformAdmin && !isImpersonating) {
      localStorage.removeItem('tenant-storage');
    }
    return data.access_token;
  } catch {
    return null;
  }
}

export async function refreshToken(): Promise<string | null> {
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }
  isRefreshing = true;
  refreshPromise = doRefreshToken().finally(() => {
    isRefreshing = false;
    refreshPromise = null;
  });
  return refreshPromise;
}

export async function ensureFreshToken(): Promise<string | null> {
  const token = TokenManager.getToken();
  if (!token) {
    return null;
  }
  if (isTokenExpiringSoon(token)) {
    const newToken = await refreshToken();
    return newToken || token;
  }
  return token;
}

export function getResponseHeaderValue(headers: ResponseHeaders, headerName: string) {
  if (!headers) {
    return undefined;
  }
  if (headers instanceof Headers) {
    return headers.get(headerName) ?? headers.get(headerName.toLowerCase()) ?? undefined;
  }
  if ('get' in headers && typeof headers.get === 'function') {
    return headers.get(headerName) ?? headers.get(headerName.toLowerCase()) ?? undefined;
  }
  const recordHeaders = headers as Record<string, string | undefined>;
  return recordHeaders[headerName] ?? recordHeaders[headerName.toLowerCase()];
}

export const __TEST_ONLY__ = {
  parseJwtExpiry,
  isTokenExpiringSoon,
};
