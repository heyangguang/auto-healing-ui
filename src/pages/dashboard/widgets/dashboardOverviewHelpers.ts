import { INCIDENT_CHART_LABELS } from '@/constants/incidentDicts';
import { INSTANCE_STATUS_LABELS } from '@/constants/instanceDicts';
import { RUN_STATUS_LABELS } from '@/constants/executionDicts';

type StatusCount = {
  count?: number;
  status?: string;
};

type IncidentSectionData = {
  by_status?: StatusCount[];
  by_healing_status?: StatusCount[];
  total?: number;
  unscanned?: number;
};

type HealingSectionData = {
  instances_by_status?: StatusCount[];
  instances_total?: number;
};

type ExecutionSectionData = {
  runs_by_status?: StatusCount[];
};

export function getStatusCount(items: readonly StatusCount[] | undefined, status: string): number {
  return items?.find((item) => item.status === status)?.count ?? 0;
}

export function getIncidentScannedCount(data?: IncidentSectionData): number {
  const total = Number(data?.total ?? 0);
  const unscanned = Number(data?.unscanned ?? 0);
  return Math.max(total - unscanned, 0);
}

export function buildIncidentStatusChartData(data?: IncidentSectionData) {
  return (data?.by_status || [])
    .map((item) => ({
      type: INCIDENT_CHART_LABELS[item.status as keyof typeof INCIDENT_CHART_LABELS] || item.status || '',
      value: item.count ?? 0,
    }))
    .filter((item) => item.value > 0);
}

export function buildInstanceStatusChartData(data?: HealingSectionData) {
  return (data?.instances_by_status || [])
    .map((item) => ({
      type: INSTANCE_STATUS_LABELS[item.status as keyof typeof INSTANCE_STATUS_LABELS] || item.status || '',
      value: item.count ?? 0,
    }))
    .filter((item) => item.type && item.value > 0);
}

export function buildExecutionStatusChartData(data?: ExecutionSectionData) {
  return (data?.runs_by_status || [])
    .map((item) => ({
      label: RUN_STATUS_LABELS[item.status as keyof typeof RUN_STATUS_LABELS] || item.status || '',
      count: item.count ?? 0,
      status: item.status || '',
    }))
    .filter((item) => item.label && item.count > 0);
}
