import { Form, message } from 'antd';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  deletePlatformUser,
  getPlatformUser,
  getPlatformUsers,
  resetPlatformUserPassword,
  updatePlatformUser,
} from '@/services/auto-healing/platform/users';
import { toDayRangeEndISO, toDayRangeStartISO } from '@/utils/dateRange';
import { fetchActivePlatformAdminCount, getPagedItems, getPagedTotal, getUserRoles } from './platformUserHelpers';
import type {
  PlatformUserRecord,
  PlatformUserStats,
  PlatformUsersAdvancedSearch,
  PlatformUsersQuery,
  PlatformUsersSearchParams,
  ResetPasswordValues,
} from './platformUserManagementTypes';

type PlatformUsersSearchField = 'username' | 'display_name';
type ApiErrorWithMessage = { response?: { data?: { message?: string } } };

const getApiErrorMessage = (error: unknown, fallback: string): string =>
  (error as ApiErrorWithMessage).response?.data?.message || fallback;
const normalizeSearchField = (field?: string): PlatformUsersSearchField =>
  field === 'display_name' ? 'display_name' : 'username';

type UsePlatformUsersControllerResult = {
  advancedSearch?: PlatformUsersAdvancedSearch;
  closeDrawer: () => void;
  closeResetPasswordModal: () => void;
  data: PlatformUserRecord[];
  drawerLoading: boolean;
  drawerOpen: boolean;
  drawerUser: PlatformUserRecord | null;
  handleDelete: (user: PlatformUserRecord) => Promise<void>;
  handlePageChange: (page: number, pageSize: number) => void;
  handleResetPassword: () => Promise<void>;
  handleSearch: (params: PlatformUsersSearchParams) => void;
  handleToggleStatus: (
    user: PlatformUserRecord,
    event?: React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement>,
  ) => Promise<void>;
  isLastPlatformAdmin: (user: PlatformUserRecord) => boolean;
  loading: boolean;
  openDrawer: (user: PlatformUserRecord) => Promise<void>;
  openResetPasswordModal: (user: PlatformUserRecord) => void;
  page: number;
  pageSize: number;
  resetPwdForm: ReturnType<typeof Form.useForm<ResetPasswordValues>>[0];
  resetPwdOpen: boolean;
  searchField: string;
  searchValue: string;
  stats: PlatformUserStats;
  submitting: boolean;
  total: number;
};

export const usePlatformUsersController = (): UsePlatformUsersControllerResult => {
  const [data, setData] = useState<PlatformUserRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<PlatformUserStats>({ total: 0, active: 0, inactive: 0 });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(16);
  const [total, setTotal] = useState(0);
  const [searchValue, setSearchValue] = useState('');
  const [searchField, setSearchField] = useState<PlatformUsersSearchField>('username');
  const [advancedSearch, setAdvancedSearch] = useState<PlatformUsersAdvancedSearch>();
  const [platformAdminRoleId, setPlatformAdminRoleId] = useState<string | null>(null);
  const [platformAdminActiveCount, setPlatformAdminActiveCount] = useState<number | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerUser, setDrawerUser] = useState<PlatformUserRecord | null>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [resetPwdOpen, setResetPwdOpen] = useState(false);
  const [resetPwdForm] = Form.useForm<ResetPasswordValues>();
  const [submitting, setSubmitting] = useState(false);
  const listRequestSeqRef = useRef(0);
  const drawerRequestSeqRef = useRef(0);

  const loadData = useCallback(async (
    currentPage: number,
    currentPageSize: number,
    value?: string,
    field?: PlatformUsersSearchField,
    advanced?: PlatformUsersAdvancedSearch,
  ) => {
    const requestSeq = listRequestSeqRef.current + 1;
    listRequestSeqRef.current = requestSeq;
    setLoading(true);
    try {
      const params: PlatformUsersQuery = { page: currentPage, page_size: currentPageSize };
      const quickField = field || 'username';
      const trimmedValue = value?.trim();
      if (trimmedValue) {
        params[quickField === 'display_name' ? 'display_name' : 'username'] = trimmedValue;
      }
      if (advanced) {
        if (advanced.username && quickField !== 'username') params.username = advanced.username;
        if (advanced.display_name && quickField !== 'display_name') params.display_name = advanced.display_name;
        if (advanced.status) params.status = advanced.status;
        if (advanced.email) params.email = advanced.email;
        if (advanced.created_at) {
          const [from, to] = advanced.created_at;
          if (from) params.created_from = toDayRangeStartISO(from);
          if (to) params.created_to = toDayRangeEndISO(to);
        }
      }
      const response = await getPlatformUsers(params);
      if (listRequestSeqRef.current !== requestSeq) return;
      setData(getPagedItems(response));
      setTotal(getPagedTotal(response));
    } catch {
      /* global error handler */
    } finally {
      if (listRequestSeqRef.current === requestSeq) setLoading(false);
    }
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const [allUsers, activeUsers, inactiveUsers, lockedUsers] = await Promise.all([
        getPlatformUsers({ page: 1, page_size: 1 }),
        getPlatformUsers({ page: 1, page_size: 1, status: 'active' }),
        getPlatformUsers({ page: 1, page_size: 1, status: 'inactive' }),
        getPlatformUsers({ page: 1, page_size: 1, status: 'locked' }),
      ]);
      setStats({
        total: getPagedTotal(allUsers),
        active: getPagedTotal(activeUsers),
        inactive: getPagedTotal(inactiveUsers) + getPagedTotal(lockedUsers),
      });
    } catch {
      /* ignore */
    }
  }, []);

  const loadPlatformAdminActiveCount = useCallback(async () => {
    const result = await fetchActivePlatformAdminCount({ platformAdminRoleId });
    if (result.roleId) setPlatformAdminRoleId(result.roleId);
    if (typeof result.activeCount === 'number') setPlatformAdminActiveCount(result.activeCount);
  }, [platformAdminRoleId]);

  useEffect(() => {
    loadData(1, pageSize);
    loadStats();
  }, [loadData, loadStats]);

  useEffect(() => {
    loadPlatformAdminActiveCount();
  }, [loadPlatformAdminActiveCount]);

  const closeDrawer = useCallback(() => {
    drawerRequestSeqRef.current += 1;
    setDrawerOpen(false);
    setDrawerLoading(false);
    setDrawerUser(null);
  }, []);

  const openDrawer = useCallback(async (user: PlatformUserRecord) => {
    const requestSeq = drawerRequestSeqRef.current + 1;
    drawerRequestSeqRef.current = requestSeq;
    setDrawerOpen(true);
    setDrawerUser(user);
    setDrawerLoading(true);
    try {
      const nextUser = await getPlatformUser(user.id);
      if (drawerRequestSeqRef.current === requestSeq) setDrawerUser(nextUser);
    } catch {
      /* keep basic data */
    } finally {
      if (drawerRequestSeqRef.current === requestSeq) setDrawerLoading(false);
    }
  }, []);

  const handleSearch = useCallback((params: PlatformUsersSearchParams) => {
    const quickFilter = params.filters?.[0];
    const nextValue = quickFilter?.value || params.searchValue || '';
    const nextField = normalizeSearchField(quickFilter?.field || params.searchField);
    setSearchValue(nextValue);
    setSearchField(nextField);
    setAdvancedSearch(params.advancedSearch);
    setPage(1);
    loadData(1, pageSize, nextValue, nextField, params.advancedSearch);
  }, [loadData, pageSize]);

  const isLastPlatformAdmin = useCallback((user: PlatformUserRecord) => {
    const isActiveAdmin =
      user.status === 'active' && getUserRoles(user).some((role) => role.name === 'platform_admin');
    return isActiveAdmin && typeof platformAdminActiveCount === 'number' && platformAdminActiveCount <= 1;
  }, [platformAdminActiveCount]);

  const handleDelete = useCallback(async (user: PlatformUserRecord) => {
    try {
      await deletePlatformUser(user.id);
      message.success('已删除平台用户');
      closeDrawer();
      const nextTotal = Math.max(0, total - 1);
      const nextPage = Math.min(page, Math.max(1, Math.ceil(nextTotal / pageSize)));
      setData((items) => items.filter((item) => item.id !== user.id));
      setTotal(nextTotal);
      setPage(nextPage);
      setStats((currentStats) => ({
        ...currentStats,
        total: nextTotal,
        ...(user.status === 'active'
          ? { active: currentStats.active - 1 }
          : { inactive: currentStats.inactive - 1 }),
      }));
      loadData(nextPage, pageSize, searchValue, searchField, advancedSearch);
      loadStats();
      loadPlatformAdminActiveCount();
    } catch (error) {
      message.error(getApiErrorMessage(error, '删除失败'));
    }
  }, [advancedSearch, closeDrawer, loadData, loadPlatformAdminActiveCount, loadStats, page, pageSize, searchField, searchValue, total]);

  const openResetPasswordModal = useCallback((user: PlatformUserRecord) => {
    setDrawerUser(user);
    resetPwdForm.resetFields();
    setResetPwdOpen(true);
  }, [resetPwdForm]);

  const closeResetPasswordModal = useCallback(() => {
    setResetPwdOpen(false);
    resetPwdForm.resetFields();
  }, [resetPwdForm]);

  const handleResetPassword = useCallback(async () => {
    if (!drawerUser) return;
    setSubmitting(true);
    try {
      const values = await resetPwdForm.validateFields();
      await resetPlatformUserPassword(drawerUser.id, { new_password: values.new_password });
      message.success('密码重置成功');
      closeResetPasswordModal();
    } catch {
      /* global error handler */
    } finally {
      setSubmitting(false);
    }
  }, [closeResetPasswordModal, drawerUser, resetPwdForm]);

  const handleToggleStatus = useCallback(async (
    user: PlatformUserRecord,
    event?: React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement>,
  ) => {
    event?.stopPropagation?.();
    const originalStatus = user.status;
    const nextStatus: AutoHealing.UpdateUserRequest['status'] =
      originalStatus === 'active' ? 'inactive' : 'active';
    if (originalStatus === 'active' && nextStatus !== 'active' && isLastPlatformAdmin(user)) {
      message.error('最后一个平台管理员，无法禁用');
      return;
    }
    setData((items) => items.map((item) => (item.id === user.id ? { ...item, status: nextStatus } : item)));
    setDrawerUser((currentUser) => (currentUser?.id === user.id ? { ...currentUser, status: nextStatus } : currentUser));
    try {
      await updatePlatformUser(user.id, { status: nextStatus });
      message.success(nextStatus === 'active' ? '已启用' : '已禁用');
      setStats((currentStats) => ({
        ...currentStats,
        active: nextStatus === 'active' ? currentStats.active + 1 : currentStats.active - 1,
        inactive: nextStatus === 'active' ? currentStats.inactive - 1 : currentStats.inactive + 1,
      }));
      loadStats();
      loadPlatformAdminActiveCount();
    } catch {
      setData((items) => items.map((item) => (item.id === user.id ? { ...item, status: originalStatus } : item)));
      setDrawerUser((currentUser) => (currentUser?.id === user.id ? { ...currentUser, status: originalStatus } : currentUser));
    }
  }, [isLastPlatformAdmin, loadPlatformAdminActiveCount, loadStats]);

  const handlePageChange = useCallback((nextPage: number, nextPageSize: number) => {
    setPage(nextPage);
    setPageSize(nextPageSize);
    loadData(nextPage, nextPageSize, searchValue, searchField, advancedSearch);
  }, [advancedSearch, loadData, searchField, searchValue]);

  return {
    advancedSearch, closeDrawer, closeResetPasswordModal, data, drawerLoading, drawerOpen, drawerUser, handleDelete,
    handlePageChange, handleResetPassword, handleSearch, handleToggleStatus, isLastPlatformAdmin, loading, openDrawer,
    openResetPasswordModal, page, pageSize, resetPwdForm, resetPwdOpen, searchField, searchValue, stats, submitting,
    total,
  };
};
