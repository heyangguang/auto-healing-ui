import { useCallback, useEffect, useState } from 'react';
import { message } from 'antd';
import {
  getSiteMessageSettings,
  updateSiteMessageSettings,
  type SiteMessageSettings,
} from '@/services/auto-healing/platform/messages';
import { extractErrorMsg } from '@/utils/errorMsg';

const DEFAULT_RETENTION_DAYS = '';
const RETENTION_DAYS_MIN = 1;
const RETENTION_DAYS_MAX = 3650;

function isValidRetentionDays(value: number) {
  return Number.isInteger(value) && value >= RETENTION_DAYS_MIN && value <= RETENTION_DAYS_MAX;
}

export default function usePlatformMessageSettings(enabled: boolean) {
  const [settings, setSettings] = useState<SiteMessageSettings | null>(null);
  const [draftRetentionDays, setDraftRetentionDays] = useState<string>(DEFAULT_RETENTION_DAYS);
  const [loading, setLoading] = useState(enabled);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      setSettings(null);
      setDraftRetentionDays(DEFAULT_RETENTION_DAYS);
      setLoading(false);
      setError(null);
      return;
    }

    let active = true;
    setLoading(true);
    getSiteMessageSettings()
      .then((response) => {
        if (!active) {
          return;
        }
        setSettings(response);
        setDraftRetentionDays(String(response.retention_days));
        setError(null);
      })
      .catch((requestError) => {
        if (!active) {
          return;
        }
        setError(extractErrorMsg(requestError as Parameters<typeof extractErrorMsg>[0], '站内信保留策略加载失败'));
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [enabled]);

  const handleRetentionDaysChange = useCallback((value: string) => {
    setDraftRetentionDays(value);
  }, []);

  const handleSave = useCallback(async () => {
    const retentionDays = Number(draftRetentionDays);
    if (!isValidRetentionDays(retentionDays)) {
      setError('保留天数必须为 1 到 3650 之间的整数');
      return;
    }

    setSubmitting(true);
    try {
      const response = await updateSiteMessageSettings({ retention_days: retentionDays });
      setSettings(response);
      setDraftRetentionDays(String(response.retention_days));
      setError(null);
      message.success('站内信保留策略已更新');
    } catch (requestError) {
      setError(extractErrorMsg(requestError as Parameters<typeof extractErrorMsg>[0], '站内信保留策略更新失败'));
    } finally {
      setSubmitting(false);
    }
  }, [draftRetentionDays]);

  return {
    settings,
    draftRetentionDays,
    loading,
    submitting,
    error,
    canSave: isValidRetentionDays(Number(draftRetentionDays)),
    onRetentionDaysChange: handleRetentionDaysChange,
    onSave: handleSave,
  };
}
