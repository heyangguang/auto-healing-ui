import type { ImpersonationSession } from '@/store/impersonation';
import { loadImpersonationState } from '@/store/impersonation';

const COMMON_API_PREFIX = '/api/v1/common/';
const TENANT_API_PREFIX = '/api/v1/tenant/';
const AUTH_CONTEXT_PATH = '/api/v1/auth/me';
const TENANT_STORAGE_KEY = 'tenant-storage';
const TOKEN_STORAGE_KEY = 'auto_healing_token';

interface StoredTenantState {
  currentTenantId?: string | null;
  currentTenantName?: string;
  tenants?: Array<{ id: string; name?: string }>;
}

type TokenClaims = {
  sub?: string;
  username?: string;
};

function parseTokenClaims(token: string): TokenClaims | null {
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
    return typeof payload === 'object' && payload ? payload as TokenClaims : null;
  } catch {
    return null;
  }
}

function getStoredToken() {
  return localStorage.getItem(TOKEN_STORAGE_KEY) || sessionStorage.getItem(TOKEN_STORAGE_KEY);
}

export function getCurrentAuthScopeKey(): string {
  const claims = parseTokenClaims(getStoredToken() || '');
  return claims?.sub || claims?.username || 'anonymous';
}

export function loadTenantState(): StoredTenantState {
  try {
    const raw = localStorage.getItem(TENANT_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed ? parsed : {};
  } catch {
    return {};
  }
}

export function getActiveImpersonationSession(): ImpersonationSession | null {
  const state = loadImpersonationState();
  return state.isImpersonating ? state.session : null;
}

export function hasActiveImpersonationSession(): boolean {
  return Boolean(getActiveImpersonationSession());
}

export function getTenantContextScopeKey(): string {
  const authScopeKey = getCurrentAuthScopeKey();
  const impersonationSession = getActiveImpersonationSession();
  if (impersonationSession) {
    return `${authScopeKey}:impersonation:${impersonationSession.tenantId}`;
  }

  const tenantId = loadTenantState().currentTenantId;
  if (tenantId) {
    return `${authScopeKey}:tenant:${tenantId}`;
  }

  return `${authScopeKey}:platform`;
}

export function usesTenantContext(url: string): boolean {
  const normalizedUrl = url.split(/[?#]/)[0] || url;
  return normalizedUrl === AUTH_CONTEXT_PATH
    || normalizedUrl.startsWith(TENANT_API_PREFIX)
    || normalizedUrl.startsWith(COMMON_API_PREFIX);
}

export function getTenantContextHeaders(url: string, isPlatformAdmin: boolean): Record<string, string> {
  if (!usesTenantContext(url)) return {};

  const impersonationSession = getActiveImpersonationSession();
  if (impersonationSession) {
    return {
      'X-Tenant-ID': impersonationSession.tenantId,
      'X-Impersonation': 'true',
      'X-Impersonation-Request-ID': impersonationSession.requestId,
    };
  }

  if (isPlatformAdmin) {
    return {};
  }

  const tenantId = loadTenantState().currentTenantId;
  return tenantId ? { 'X-Tenant-ID': tenantId } : {};
}
