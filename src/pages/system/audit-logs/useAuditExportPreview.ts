import { useEffect, useRef, useState } from 'react';
import { getAuditLogs } from '@/services/auto-healing/auditLogs';
import { buildAuditExportParams } from './helpers';
import type { AuditCategory, AuditExportValues } from './types';

type UseAuditExportPreviewOptions = {
  open: boolean;
  hasExportCondition: boolean;
  values: AuditExportValues | undefined;
  category: AuditCategory;
};

export const useAuditExportPreview = ({
  open,
  hasExportCondition,
  values,
  category,
}: UseAuditExportPreviewOptions) => {
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!open || !hasExportCondition || !values) {
      setPreviewCount(null);
      return undefined;
    }

    setPreviewLoading(true);
    timerRef.current = setTimeout(async () => {
      try {
        const response = await getAuditLogs(buildAuditExportParams(values, category, 1, 1));
        setPreviewCount(response.total ?? null);
      } catch {
        setPreviewCount(null);
      } finally {
        setPreviewLoading(false);
      }
    }, 500);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [category, hasExportCondition, open, values]);

  return { previewCount, previewLoading };
};
