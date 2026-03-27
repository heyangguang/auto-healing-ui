import { useEffect, useMemo, useState } from 'react';
import type {
  AdvancedSearchField,
} from './types';
import type {
  SearchSchemaField,
  SearchSchemaRequest,
} from '@/services/auto-healing/searchSchema';

export function useStandardTableSearchSchema(
  advancedSearchFields?: AdvancedSearchField[],
  searchSchemaRequest?: SearchSchemaRequest,
) {
  const [dynamicSearchFields, setDynamicSearchFields] = useState<AdvancedSearchField[] | null>(null);
  const [schemaLoadError, setSchemaLoadError] = useState<string | null>(null);

  useEffect(() => {
    setDynamicSearchFields(null);
    setSchemaLoadError(null);
    if (!searchSchemaRequest) {
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const response = await searchSchemaRequest();
        if (cancelled) {
          return;
        }
        const fields: SearchSchemaField[] = response?.fields || response?.data?.fields || [];
        const converted: AdvancedSearchField[] = fields.flatMap((field) => {
          if (!field.key || !field.label) {
            return [];
          }
          let type: AdvancedSearchField['type'] = 'input';
          let options = field.options;
          if (field.type === 'enum') {
            type = 'select';
          } else if (field.type === 'boolean') {
            type = 'select';
            options = [
              { label: '是', value: 'true' },
              { label: '否', value: 'false' },
            ];
          } else if (field.type === 'dateRange') {
            type = 'dateRange';
          }
          return [{
            key: field.key,
            label: field.label,
            type,
            placeholder: field.placeholder,
            description: field.description,
            options,
            defaultMatchMode: field.default_match_mode === 'exact' ? 'exact' : 'fuzzy',
          }];
        });
        setDynamicSearchFields(converted);
      } catch (error) {
        if (cancelled) {
          return;
        }
        const message = error instanceof Error ? error.message : '未知错误';
        setSchemaLoadError(`后端搜索 Schema 加载失败: ${message}`);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [searchSchemaRequest]);

  const effectiveAdvancedSearchFields = useMemo(() => {
    const staticFields = advancedSearchFields || [];
    const dynamicFields = dynamicSearchFields || [];
    if (!dynamicFields.length) {
      return staticFields.length ? staticFields : undefined;
    }
    if (!staticFields.length) {
      return dynamicFields;
    }
    const dynamicKeys = new Set(dynamicFields.map((field) => field.key));
    const extra = staticFields.filter((field) => !dynamicKeys.has(field.key));
    return [...dynamicFields, ...extra];
  }, [advancedSearchFields, dynamicSearchFields]);

  return {
    effectiveAdvancedSearchFields,
    schemaLoadError,
  };
}
