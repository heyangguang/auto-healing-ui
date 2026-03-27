import { useCallback, useEffect, useRef, useState } from 'react';
import { getIncident, getIncidents, type IncidentQueryParams } from '@/services/auto-healing/incidents';
import { createRequestSequence } from '@/utils/requestSequence';

type UseIncidentSelectorStateOptions = {
  open: boolean;
  value?: string;
};

export const useIncidentSelectorState = ({
  open,
  value,
}: UseIncidentSelectorStateOptions) => {
  const loadSequenceRef = useRef(createRequestSequence());
  const prefillSequenceRef = useRef(createRequestSequence());
  const manualSelectionRef = useRef(false);

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<AutoHealing.Incident[]>([]);
  const [total, setTotal] = useState(0);
  const [selectedRowKey, setSelectedRowKey] = useState<string | undefined>(value);
  const [selectedIncident, setSelectedIncident] = useState<AutoHealing.Incident | null>(null);

  const [search, setSearch] = useState('');
  const [severity, setSeverity] = useState<AutoHealing.IncidentSeverity | undefined>();
  const [status, setStatus] = useState<AutoHealing.IncidentStatus | undefined>();
  const [healingStatus, setHealingStatus] = useState<AutoHealing.HealingStatus | undefined>();
  const [sourcePlugin, setSourcePlugin] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const buildParams = useCallback((): IncidentQueryParams => {
    const params: IncidentQueryParams = {
      page,
      page_size: pageSize,
    };

    if (search.trim()) params.title = search.trim();
    if (sourcePlugin.trim()) params.source_plugin_name = sourcePlugin.trim();
    if (severity) params.severity = severity;
    if (status) params.status = status;
    if (healingStatus) params.healing_status = healingStatus;

    return params;
  }, [healingStatus, page, pageSize, search, severity, sourcePlugin, status]);

  const fetchData = useCallback(async () => {
    const token = loadSequenceRef.current.next();
    setLoading(true);
    try {
      const res = await getIncidents(buildParams());
      if (!loadSequenceRef.current.isCurrent(token)) {
        return;
      }

      const items = res.data || [];
      setData(items);
      setTotal(res.total || items.length);
    } catch (error) {
      if (!loadSequenceRef.current.isCurrent(token)) {
        return;
      }
      console.error('Failed to fetch incidents:', error);
      setData([]);
      setTotal(0);
    } finally {
      if (loadSequenceRef.current.isCurrent(token)) {
        setLoading(false);
      }
    }
  }, [buildParams]);

  useEffect(() => {
    if (!open) {
      loadSequenceRef.current.invalidate();
      prefillSequenceRef.current.invalidate();
      manualSelectionRef.current = false;
      return;
    }

    void fetchData();
  }, [fetchData, open]);

  useEffect(() => {
    if (!open) {
      manualSelectionRef.current = false;
      return;
    }

    manualSelectionRef.current = false;
    setSelectedRowKey(value);
    if (!value) {
      setSelectedIncident(null);
    }
  }, [open, value]);

  useEffect(() => {
    if (!value || manualSelectionRef.current) {
      return;
    }

    const matched = data.find((item) => item.id === value);
    if (matched) {
      setSelectedIncident(matched);
      setSelectedRowKey(matched.id);
    }
  }, [data, value]);

  useEffect(() => {
    if (!open || !value || selectedRowKey === value || manualSelectionRef.current) {
      return;
    }

    const token = prefillSequenceRef.current.next();
    getIncident(value)
      .then((incident) => {
        if (
          !prefillSequenceRef.current.isCurrent(token)
          || manualSelectionRef.current
          || !incident?.id
        ) {
          return;
        }

        setSelectedIncident(incident);
        setSelectedRowKey(incident.id);
      })
      .catch(() => {
        // ignore stale or invalid selection
      });
  }, [open, selectedRowKey, value]);

  const handleReset = useCallback(() => {
    setSearch('');
    setSeverity(undefined);
    setStatus(undefined);
    setHealingStatus(undefined);
    setSourcePlugin('');
    setPage(1);
  }, []);

  const handlePageChange = useCallback((nextPage: number, nextPageSize?: number) => {
    setPage(nextPage);
    setPageSize(nextPageSize || 10);
  }, []);

  const handleManualSelect = useCallback((incident: AutoHealing.Incident) => {
    prefillSequenceRef.current.invalidate();
    manualSelectionRef.current = true;
    setSelectedRowKey(incident.id);
    setSelectedIncident(incident);
  }, []);

  return {
    data,
    handleManualSelect,
    handlePageChange,
    handleReset,
    healingStatus,
    loading,
    page,
    pageSize,
    search,
    selectedIncident,
    selectedRowKey,
    setHealingStatus,
    setPage,
    setSearch,
    setSeverity,
    setSourcePlugin,
    setStatus,
    severity,
    sourcePlugin,
    status,
    total,
  };
};
