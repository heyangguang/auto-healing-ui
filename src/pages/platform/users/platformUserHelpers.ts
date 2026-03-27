import { USER_STATUS_MAP } from '@/constants/commonDicts';
import { getPlatformRoleUsers, getPlatformRoles } from '@/services/auto-healing/roles';
import type {
  PlatformUserPageResponse,
  PlatformUserRole,
} from '@/services/auto-healing/platform/contracts';
import type {
  PlatformAdminCountResult,
  PlatformUserRecord,
  PlatformUserStatus,
} from './platformUserManagementTypes';

const PLATFORM_ADMIN_FETCH_LIMIT = 50;
const PLATFORM_ADMIN_PAGE_SIZE = 200;

export const getPagedItems = (response: PlatformUserPageResponse) => response.data || [];

export const getPagedTotal = (response: PlatformUserPageResponse) =>
  Number(response.total ?? getPagedItems(response).length);

export const isPlatformAdminRole = (role: PlatformUserRole) => role.name === 'platform_admin';

export const getUserRoles = (user: PlatformUserRecord) => user.roles || [];

export const getPlatformUserStatusInfo = (status: PlatformUserStatus) =>
  USER_STATUS_MAP[status] || USER_STATUS_MAP.inactive;

export const getPlatformUserName = (user: PlatformUserRecord) => user.display_name || user.username;

export const getPlatformUserInitial = (user: PlatformUserRecord) =>
  getPlatformUserName(user)?.[0]?.toUpperCase() || 'U';

const fetchPlatformAdminRoleId = async (roleId?: string | null) => {
  if (roleId) {
    return roleId;
  }
  const roles = await getPlatformRoles();
  return roles.find(isPlatformAdminRole)?.id || null;
};

const countActivePlatformAdmins = async (roleId: string) => {
  let page = 1;
  let fetched = 0;
  let total = 0;
  let activeCount = 0;
  for (let guard = 0; guard < PLATFORM_ADMIN_FETCH_LIMIT; guard += 1) {
    const response = await getPlatformRoleUsers(roleId, {
      page,
      page_size: PLATFORM_ADMIN_PAGE_SIZE,
    });
    const items = response.data || [];
    total = typeof response.total === 'number' ? response.total : total;
    activeCount += items.filter((user) => user.status === 'active').length;
    fetched += items.length;
    if (items.length === 0 || (total > 0 && fetched >= total)) {
      return activeCount;
    }
    page += 1;
  }
  return activeCount;
};

export async function fetchActivePlatformAdminCount(opts: {
  platformAdminRoleId?: string | null;
}): Promise<PlatformAdminCountResult> {
  try {
    const roleId = await fetchPlatformAdminRoleId(opts.platformAdminRoleId);
    if (!roleId) {
      return { roleId: null, activeCount: null };
    }
    return {
      roleId,
      activeCount: await countActivePlatformAdmins(roleId),
    };
  } catch {
    return { roleId: opts.platformAdminRoleId || null, activeCount: null };
  }
}
