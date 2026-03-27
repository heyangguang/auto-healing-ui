import { useEffect, useMemo, useState } from 'react';
import {
  getSiteMessageCategories,
  type SiteMessageCategory,
} from '@/services/auto-healing/siteMessage';
import { extractErrorMsg } from '@/utils/errorMsg';
import { buildCategoryMap, buildSystemMessageAdvancedSearchFields } from './messagePageShared';

export default function useSiteMessageCategories() {
  const [categories, setCategories] = useState<SiteMessageCategory[]>([]);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);

  useEffect(() => {
    getSiteMessageCategories()
      .then((items) => {
        setCategories(items);
        setCategoriesError(null);
      })
      .catch((error) => {
        setCategoriesError(extractErrorMsg(error as Parameters<typeof extractErrorMsg>[0], '消息分类加载失败'));
      });
  }, []);

  const categoryMap = useMemo(() => buildCategoryMap(categories), [categories]);
  const advancedSearchFields = useMemo(() => buildSystemMessageAdvancedSearchFields(categories), [categories]);

  return { categoryMap, advancedSearchFields, categoriesError };
}
