export const TENANT_CONTEXT_CHANGE_EVENT = 'tenant-context:changed';

export function emitTenantContextChanged() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(TENANT_CONTEXT_CHANGE_EVENT));
  }
}

export function subscribeTenantContextChanged(listener: () => void) {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const handleStorage = (event: StorageEvent) => {
    if (!event.key || event.key === 'tenant-storage' || event.key === 'impersonation-storage' || event.key === 'auto_healing_token') {
      listener();
    }
  };

  window.addEventListener(TENANT_CONTEXT_CHANGE_EVENT, listener);
  window.addEventListener('storage', handleStorage);

  return () => {
    window.removeEventListener(TENANT_CONTEXT_CHANGE_EVENT, listener);
    window.removeEventListener('storage', handleStorage);
  };
}
