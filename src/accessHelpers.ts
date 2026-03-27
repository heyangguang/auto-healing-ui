type CurrentUserLike = Pick<API.CurrentUser, 'is_platform_admin'> | undefined;

export function hasActiveImpersonationSession(): boolean {
  try {
    const raw = localStorage.getItem('impersonation-storage');
    if (!raw) {
      return false;
    }
    const state = JSON.parse(raw) as {
      isImpersonating?: boolean;
      session?: { expiresAt?: string };
    };
    if (!state.isImpersonating || !state.session?.expiresAt) {
      return false;
    }
    if (new Date(state.session.expiresAt) > new Date()) {
      return true;
    }
    localStorage.removeItem('impersonation-storage');
    return false;
  } catch {
    return false;
  }
}

export function resolvePlatformAdminFlag(currentUser: CurrentUserLike): boolean {
  if (currentUser?.is_platform_admin !== true) {
    return false;
  }
  return !hasActiveImpersonationSession();
}

export function createPermissionHelpers(permissions: string[]) {
  const hasPermission = (required: string): boolean => {
    if (permissions.length === 0) {
      return false;
    }
    return permissions.some((permission) => (
      permission === '*'
      || permission === required
      || (permission.endsWith(':*') && required.startsWith(`${permission.slice(0, -2)}:`))
    ));
  };

  const hasAnyPermission = (...requiredList: string[]) => (
    requiredList.some(hasPermission)
  );

  return { hasPermission, hasAnyPermission };
}
