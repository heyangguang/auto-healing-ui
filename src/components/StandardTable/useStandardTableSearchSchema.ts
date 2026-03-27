import { request as umiRequest } from '@umijs/max';
import { useEffect, useMemo, useState } from 'react';
import type { AdvancedSearchField } from './index';

export function useStandardTableSearchSchema(
  advancedSearchFields?: AdvancedSearchField[],
  searchSchemaUrl?: string,
) {
  const [dynamicSearchFields, setDynamicSearchFields] = useState<AdvancedSearchField[] | null>(null);

  useEffect(() => {
    setDynamicSearchFields(null);
    if (!searchSchemaUrl) {
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const response = await umiRequest(searchSchemaUrl);
        if (cancelled) {
          return;
        }
        const fields: any[] = response?.fields || response?.data?.fields || [];
        const converted: AdvancedSearchField[] = fields.map((field: any) => {
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
          return {
            key: field.key,
            label: field.label,
            type,
            placeholder: field.placeholder,
            description: field.description,
            options,
            defaultMatchMode: field.default_match_mode === 'exact' ? 'exact' : 'fuzzy',
          };
        });
        setDynamicSearchFields(converted);
      } catch {
        // Ignore schema load failures and fall back to static fields.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [searchSchemaUrl]);

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
  };
}
