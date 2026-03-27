import type { Dayjs } from 'dayjs';

export type UserRecord = AutoHealing.User & {
  role_id?: string;
  role_name?: string;
  user_id?: string;
};

export type UserRoleRecord =
  | AutoHealing.RoleDetail
  | {
      id: string;
      name?: string;
      display_name?: string;
      is_system?: boolean;
    };

export type UsersAdvancedSearch = {
  username?: string;
  username__exact?: string;
  email?: string;
  email__exact?: string;
  display_name?: string;
  display_name__exact?: string;
  user_id?: string;
  user_id__exact?: string;
  roles?: string;
  status?: AutoHealing.User['status'];
  created_at?: [Dayjs | null, Dayjs | null];
};

export type UsersRequestParams = {
  page: number;
  pageSize: number;
  searchField?: string;
  searchValue?: string;
  advancedSearch?: UsersAdvancedSearch;
  sorter?: { field: string; order: 'ascend' | 'descend' };
};

export type UserTableRequestResult = {
  data: UserRecord[];
  total: number;
};
