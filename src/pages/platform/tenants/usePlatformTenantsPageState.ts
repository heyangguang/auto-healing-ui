import { useAccess } from '@umijs/max';
import { message } from 'antd';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  deleteTenant,
  getTenant,
  getTenantMembers,
  getTenants,
  updateTenant,
  type PlatformTenantMember,
  type PlatformTenantRecord,
} from '@/services/auto-healing/platform/tenants';
import type { TenantStats, TenantsAdvancedSearch, TenantsQuery, TenantsSearchParams } from './platformTenantsShared';

export function usePlatformTenantsPageState() {
  const access = useAccess();
  const [data, setData] = useState<PlatformTenantRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<TenantStats>({ total: 0, active: 0, inactive: 0 });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(16);
  const [total, setTotal] = useState(0);
  const [searchField, setSearchField] = useState('keyword');
  const [searchValue, setSearchValue] = useState('');
  const [advancedSearch, setAdvancedSearch] = useState<TenantsAdvancedSearch | undefined>();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTenant, setDrawerTenant] = useState<PlatformTenantRecord | null>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [members, setMembers] = useState<PlatformTenantMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersLoadFailed, setMembersLoadFailed] = useState(false);

  const dataRequestSeqRef = useRef(0);
  const drawerTenantRequestSeqRef = useRef(0);
  const drawerMembersRequestSeqRef = useRef(0);

  const loadStats = useCallback(async () => {
    try {
      const [allRes, activeRes, disabledRes] = await Promise.all([
        getTenants({ page: 1, page_size: 1 }),
        getTenants({ page: 1, page_size: 1, status: 'active' }),
        getTenants({ page: 1, page_size: 1, status: 'disabled' }),
      ]);
      setStats({
        total: Number(allRes.total ?? 0),
        active: Number(activeRes.total ?? 0),
        inactive: Number(disabledRes.total ?? 0),
      });
    } catch {
      /* global error handler */
    }
  }, []);

  const loadData = useCallback(async (nextPage: number, nextPageSize: number, field?: string, value?: string, nextAdvanced?: TenantsAdvancedSearch) => {
    const requestSeq = dataRequestSeqRef.current + 1;
    dataRequestSeqRef.current = requestSeq;
    setLoading(true);
    try {
      const params: TenantsQuery = { page: nextPage, page_size: nextPageSize };
      const quickField = field || 'keyword';
      if (value?.trim()) {
        params.keyword = value.trim();
      }
      if (nextAdvanced) {
        if (nextAdvanced.keyword && quickField !== 'keyword') params.keyword = nextAdvanced.keyword;
        if (nextAdvanced.name) params.name = nextAdvanced.name;
        if (nextAdvanced.code) params.code = nextAdvanced.code;
        if (nextAdvanced.status) params.status = nextAdvanced.status;
      }
      const response = await getTenants(params);
      if (dataRequestSeqRef.current !== requestSeq) {
        return;
      }
      const list = response.data || [];
      setData(list);
      setTotal(response.total || list.length);
    } catch {
      /* global error handler */
    } finally {
      if (dataRequestSeqRef.current === requestSeq) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadData(1, pageSize);
    loadStats();
  }, [loadData, loadStats, pageSize]);

  const handleSearch = useCallback((params: TenantsSearchParams) => {
    const quickFilter = params.filters?.[0];
    const field = quickFilter?.field || params.searchField || 'keyword';
    const value = quickFilter?.value || params.searchValue || '';
    setSearchField(field);
    setSearchValue(value);
    setAdvancedSearch(params.advancedSearch);
    setPage(1);
    loadData(1, pageSize, field, value, params.advancedSearch);
  }, [loadData, pageSize]);

  const handlePageChange = useCallback((nextPage: number, nextPageSize: number) => {
    setPage(nextPage);
    setPageSize(nextPageSize);
    loadData(nextPage, nextPageSize, searchField, searchValue, advancedSearch);
  }, [advancedSearch, loadData, searchField, searchValue]);

  const openDrawer = useCallback(async (tenant: PlatformTenantRecord) => {
    const tenantRequestSeq = drawerTenantRequestSeqRef.current + 1;
    drawerTenantRequestSeqRef.current = tenantRequestSeq;
    const membersRequestSeq = drawerMembersRequestSeqRef.current + 1;
    drawerMembersRequestSeqRef.current = membersRequestSeq;
    setDrawerOpen(true);
    setDrawerTenant(tenant);
    setDrawerLoading(true);
    setMembersLoading(true);
    setMembersLoadFailed(false);
    try {
      const nextTenant = await getTenant(tenant.id);
      if (drawerTenantRequestSeqRef.current === tenantRequestSeq) {
        setDrawerTenant(nextTenant);
      }
    } catch {
      /* keep basic data */
    } finally {
      if (drawerTenantRequestSeqRef.current === tenantRequestSeq) {
        setDrawerLoading(false);
      }
    }
    try {
      const nextMembers = await getTenantMembers(tenant.id);
      if (drawerMembersRequestSeqRef.current === membersRequestSeq) {
        setMembers(nextMembers);
        setMembersLoadFailed(false);
      }
    } catch {
      if (drawerMembersRequestSeqRef.current === membersRequestSeq) {
        setMembers([]);
        setMembersLoadFailed(true);
      }
    } finally {
      if (drawerMembersRequestSeqRef.current === membersRequestSeq) {
        setMembersLoading(false);
      }
    }
  }, []);

  const closeDrawer = useCallback(() => {
    drawerTenantRequestSeqRef.current += 1;
    drawerMembersRequestSeqRef.current += 1;
    setDrawerOpen(false);
    setDrawerLoading(false);
    setDrawerTenant(null);
    setMembersLoading(false);
    setMembersLoadFailed(false);
    setMembers([]);
  }, []);

  const handleToggle = useCallback(async (tenant: PlatformTenantRecord, checked: boolean) => {
    const originalStatus = tenant.status;
    const nextStatus: PlatformTenantRecord['status'] = checked ? 'active' : 'disabled';
    setData((prev) => prev.map((item) => (item.id === tenant.id ? { ...item, status: nextStatus } : item)));
    setActionLoading(tenant.id);
    try {
      await updateTenant(tenant.id, { status: nextStatus });
      message.success(checked ? `已启用「${tenant.name}」` : `已禁用「${tenant.name}」`);
      setStats((prev) => ({
        ...prev,
        active: checked ? prev.active + 1 : prev.active - 1,
        inactive: checked ? prev.inactive - 1 : prev.inactive + 1,
      }));
      loadStats();
    } catch {
      setData((prev) => prev.map((item) => (item.id === tenant.id ? { ...item, status: originalStatus } : item)));
    } finally {
      setActionLoading(null);
    }
  }, [loadStats]);

  const handleDelete = useCallback(async (_event: React.MouseEvent | undefined, tenant: PlatformTenantRecord) => {
    setActionLoading(tenant.id);
    try {
      await deleteTenant(tenant.id);
      message.success('租户删除成功');
      setDrawerOpen(false);
      const nextTotal = Math.max(0, total - 1);
      const nextPage = Math.min(page, Math.max(1, Math.ceil(nextTotal / pageSize)));
      setData((prev) => prev.filter((item) => item.id !== tenant.id));
      setTotal(nextTotal);
      setPage(nextPage);
      setStats((prev) => ({
        ...prev,
        total: nextTotal,
        ...(tenant.status === 'active' ? { active: prev.active - 1 } : { inactive: prev.inactive - 1 }),
      }));
      loadData(nextPage, pageSize, searchField, searchValue, advancedSearch);
      loadStats();
    } catch {
      /* global error handler */
    } finally {
      setActionLoading(null);
    }
  }, [advancedSearch, loadData, loadStats, page, pageSize, searchField, searchValue, total]);

  return {
    access,
    actionLoading,
    drawerLoading,
    drawerOpen,
    drawerTenant,
    handleDelete,
    handlePageChange,
    handleSearch,
    handleToggle,
    loading,
    members,
    membersLoadFailed,
    membersLoading,
    openDrawer,
    closeDrawer,
    data,
    page,
    pageSize,
    stats,
    total,
  };
}
