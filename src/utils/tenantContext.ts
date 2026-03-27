import type { ImpersonationSession } from '@/store/impersonation';
import { loadImpersonationState } from '@/store/impersonation';

const COMMON_API_PREFIX = '/api/v1/common/';
const TENANT_API_PREFIX = '/api/v1/tenant/';
const AUTH_CONTEXT_PATH = '/api/v1/auth/me';
const TENANT_STORAGE_KEY = 'tenant-storage';

interface StoredTenantState {
  currentTenantId?: string | null;
  currentTenantName?: string;
  tenants?: Array<{ id: string; name?: string }>;
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
