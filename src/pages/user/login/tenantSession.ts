type LoginTenantSummary = {
  currentTenantId?: string;
  isPlatformAdmin: boolean;
  tenants?: unknown[];
};

export function persistTenantSession({
  currentTenantId,
  isPlatformAdmin,
  tenants,
}: LoginTenantSummary) {
  localStorage.setItem('is-platform-admin', isPlatformAdmin ? 'true' : 'false');

  if (isPlatformAdmin) {
    localStorage.removeItem('tenant-storage');
    return 'platform';
  }

  if (!tenants?.length) {
    localStorage.removeItem('tenant-storage');
    return 'none';
  }

  localStorage.setItem('tenant-storage', JSON.stringify({
    currentTenantId,
    tenants,
  }));
  return 'tenant';
}
