import dayjs from 'dayjs';
import { getUsers } from '@/services/auto-healing/users';
import { toDayRangeEndISO, toDayRangeStartISO } from '@/utils/dateRange';
import type {
  UserRecord,
  UserRoleRecord,
  UserTableRequestResult,
  UsersAdvancedSearch,
  UsersRequestParams,
} from './userManagementTypes';

type UsersApiBaseParams = {
  role_id?: string;
  user_id?: string;
};

type UserSearchContext = {
  apiBaseParams: UsersApiBaseParams;
  createdAtRange?: UsersAdvancedSearch['created_at'];
  exactDisplayName?: string;
  exactEmail?: string;
  exactUserId?: string;
  exactUsername?: string;
  searchField?: string;
  searchValue?: string;
  statusFilter?: AutoHealing.User['status'];
};

const USERS_PAGE_SIZE = 200;

const trimValue = (value?: string) => value?.trim() || undefined;

export const getUserRoles = (
  user: UserRecord & { role_id?: string; role_name?: string },
): UserRoleRecord[] => {
  if (Array.isArray(user.roles) && user.roles.length > 0) {
    return user.roles;
  }
  if (user.role_id || user.role_name) {
    return [{ id: user.role_id || user.role_name || 'unknown', display_name: user.role_name }];
  }
  return [];
};

export const getUserIdentifier = (user: UserRecord) => user.user_id || user.id || '';

export const toUserStatus = (status: string | undefined): AutoHealing.User['status'] | undefined =>
  status === 'active' || status === 'inactive' ? status : undefined;

const applyAdvancedSearch = (
  advancedSearch: UsersAdvancedSearch,
  context: UserSearchContext,
): UserSearchContext => {
  const nextContext = { ...context };
  if (!nextContext.searchValue) {
    nextContext.searchField = nextContext.searchField || 'username';
    nextContext.searchValue =
      trimValue(advancedSearch.username)
      || trimValue(advancedSearch.email)
      || trimValue(advancedSearch.display_name)
      || trimValue(advancedSearch.user_id);
  }
  nextContext.exactUsername = trimValue(advancedSearch.username__exact);
  nextContext.exactEmail = trimValue(advancedSearch.email__exact);
  nextContext.exactDisplayName = trimValue(advancedSearch.display_name__exact);
  nextContext.exactUserId = trimValue(advancedSearch.user_id__exact);
  nextContext.apiBaseParams = {
    ...nextContext.apiBaseParams,
    role_id: advancedSearch.roles || undefined,
    user_id: nextContext.exactUserId,
  };
  nextContext.createdAtRange = advancedSearch.created_at;
  nextContext.statusFilter = toUserStatus(advancedSearch.status);
  return nextContext;
};

const buildUserSearchContext = (params: UsersRequestParams): UserSearchContext => {
  const context: UserSearchContext = {
    apiBaseParams: {},
    searchField: params.searchField,
    searchValue: trimValue(params.searchValue),
  };
  if (context.searchField === 'roles' && context.searchValue) {
    context.apiBaseParams.role_id = context.searchValue;
    context.searchValue = undefined;
  }
  if (context.searchField === 'status' && context.searchValue) {
    context.statusFilter = toUserStatus(context.searchValue);
    context.searchValue = undefined;
  }
  if (!params.advancedSearch) {
    return context;
  }
  return applyAdvancedSearch(params.advancedSearch, context);
};

const fetchAllUsers = async (apiBaseParams: UsersApiBaseParams): Promise<UserRecord[]> => {
  const items: UserRecord[] = [];
  let page = 1;
  while (true) {
    const response = await getUsers({ ...apiBaseParams, page, page_size: USERS_PAGE_SIZE });
    const batch = response.data || [];
    items.push(...batch);
    const total = response.total ?? batch.length;
    if (items.length >= total || batch.length === 0) {
      return items;
    }
    page += 1;
  }
};

const matchesKeyword = (item: UserRecord, searchField: string, keyword: string) => {
  if (searchField === 'user_id') {
    return getUserIdentifier(item).toLowerCase().includes(keyword);
  }
  const fieldValue = item[searchField as keyof UserRecord];
  return String(fieldValue || '').toLowerCase().includes(keyword);
};

const filterByKeyword = (items: UserRecord[], searchField?: string, searchValue?: string) => {
  if (!searchValue) {
    return items;
  }
  const keyword = searchValue.toLowerCase();
  return items.filter((item) => matchesKeyword(item, searchField || 'username', keyword));
};

const filterByExactMatches = (items: UserRecord[], context: UserSearchContext) =>
  items.filter((item) => {
    if (context.exactUsername && String(item.username || '').trim() !== context.exactUsername) {
      return false;
    }
    if (context.exactEmail && String(item.email || '').trim() !== context.exactEmail) {
      return false;
    }
    if (
      context.exactDisplayName
      && String(item.display_name || '').trim() !== context.exactDisplayName
    ) {
      return false;
    }
    return !context.exactUserId || getUserIdentifier(item).trim() === context.exactUserId;
  });

const filterByStatus = (items: UserRecord[], status?: AutoHealing.User['status']) =>
  status ? items.filter((item) => item.status === status) : items;

const filterByCreatedAt = (items: UserRecord[], createdAtRange?: UsersAdvancedSearch['created_at']) => {
  if (!createdAtRange?.[0] || !createdAtRange[1]) {
    return items;
  }
  const from = dayjs(toDayRangeStartISO(createdAtRange[0]));
  const to = dayjs(toDayRangeEndISO(createdAtRange[1]));
  return items.filter((item) => {
    const createdAt = dayjs(item.created_at);
    return createdAt.isValid() && !createdAt.isBefore(from) && !createdAt.isAfter(to);
  });
};

const sortUsers = (items: UserRecord[], sorter?: UsersRequestParams['sorter']) => {
  if (!sorter?.field) {
    return items;
  }
  const multiplier = sorter.order === 'ascend' ? 1 : -1;
  return [...items].sort((a, b) => {
    if (sorter.field === 'created_at') {
      return (dayjs(a.created_at).valueOf() - dayjs(b.created_at).valueOf()) * multiplier;
    }
    const left = a[sorter.field as keyof UserRecord];
    const right = b[sorter.field as keyof UserRecord];
    return String(left ?? '').localeCompare(String(right ?? '')) * multiplier;
  });
};

const paginateUsers = (
  items: UserRecord[],
  page: number,
  pageSize: number,
): UserTableRequestResult => {
  const start = (page - 1) * pageSize;
  return {
    data: items.slice(start, start + pageSize),
    total: items.length,
  };
};

export const requestUsersPage = async (
  params: UsersRequestParams,
): Promise<UserTableRequestResult> => {
  const context = buildUserSearchContext(params);
  const allUsers = await fetchAllUsers(context.apiBaseParams);
  const filteredUsers = filterByCreatedAt(
    filterByStatus(
      filterByExactMatches(
        filterByKeyword(allUsers, context.searchField, context.searchValue),
        context,
      ),
      context.statusFilter,
    ),
    context.createdAtRange,
  );
  return paginateUsers(sortUsers(filteredUsers, params.sorter), params.page, params.pageSize);
};
