import { useEffect, useState } from 'react';
import {
  getSiteMessageCategories,
  type SiteMessageCategory,
} from '@/services/auto-healing/platform/messages';
import { getTenants, type PlatformTenantRecord } from '@/services/auto-healing/platform/tenants';
import { extractErrorMsg } from '@/utils/errorMsg';
import { fetchAllPages } from '@/utils/fetchAllPages';

export interface TenantSelectOption {
  label: string;
  value: string;
}

export default function usePlatformMessageOptions() {
  const [categories, setCategories] = useState<SiteMessageCategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [tenants, setTenants] = useState<TenantSelectOption[]>([]);
  const [tenantsLoading, setTenantsLoading] = useState(false);
  const [tenantsError, setTenantsError] = useState<string | null>(null);

  useEffect(() => {
    setCategoriesLoading(true);
    getSiteMessageCategories()
      .then((items) => {
        setCategories(items);
        setCategoriesError(null);
      })
      .catch((error) => {
        setCategoriesError(extractErrorMsg(error as Parameters<typeof extractErrorMsg>[0], '消息分类加载失败'));
      })
      .finally(() => setCategoriesLoading(false));
  }, []);

  useEffect(() => {
    setTenantsLoading(true);
    fetchAllPages<PlatformTenantRecord>((page, pageSize) => getTenants({ page, page_size: pageSize }))
      .then((items) => {
        setTenants(items.map((tenant) => ({ label: tenant.name, value: tenant.id })));
        setTenantsError(null);
      })
      .catch((error) => {
        setTenantsError(extractErrorMsg(error as Parameters<typeof extractErrorMsg>[0], '租户列表加载失败'));
      })
      .finally(() => setTenantsLoading(false));
  }, []);

  return {
    categories,
    categoriesLoading,
    categoriesError,
    tenants,
    tenantsLoading,
    tenantsError,
  };
}
