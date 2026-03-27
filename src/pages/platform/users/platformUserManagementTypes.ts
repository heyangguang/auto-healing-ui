import type { Dayjs } from 'dayjs';
import type {
  PlatformUserRecord,
  PlatformUserStatus,
  PlatformUsersListParams,
} from '@/services/auto-healing/platform/contracts';

export type PlatformUsersAdvancedSearch = {
  username?: string;
  display_name?: string;
  status?: PlatformUserStatus;
  email?: string;
  created_at?: [Dayjs | null, Dayjs | null];
};

export type PlatformUsersSearchParams = {
  searchField?: string;
  searchValue?: string;
  advancedSearch?: PlatformUsersAdvancedSearch;
  filters?: { field: string; value: string }[];
};

export type PlatformUsersQuery = PlatformUsersListParams & {
  page: number;
  page_size: number;
};

export type PlatformUserStats = {
  total: number;
  active: number;
  inactive: number;
};

export type ResetPasswordValues = {
  new_password: string;
  confirm_password: string;
};

export type PlatformAdminCountResult = {
  roleId: string | null;
  activeCount: number | null;
};

export type { PlatformUserRecord, PlatformUserStatus };
