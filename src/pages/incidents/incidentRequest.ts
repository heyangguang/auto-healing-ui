import type { IncidentQueryParams } from '@/services/auto-healing/incidents';
import type { IncidentRequestParams } from './incidentPageConfig';

function toBooleanParam(value: unknown) {
  if (typeof value === 'boolean') {
    return value;
  }
  if (value === 'true') {
    return true;
  }
  if (value === 'false') {
    return false;
  }
  return undefined;
}

function applyIncidentSearchParam(
  apiParams: IncidentQueryParams,
  field: string,
  value: unknown,
) {
  if (value === undefined || value === null || value === '') {
    return;
  }

  const normalizedField = field.replace(/^__enum__/, '');
  const textValue = String(value);

  switch (normalizedField) {
    case 'external_id':
      apiParams.external_id = textValue;
      break;
    case 'external_id__exact':
      apiParams.external_id__exact = textValue;
      break;
    case 'source_plugin_name':
      apiParams.source_plugin_name = textValue;
      break;
    case 'source_plugin_name__exact':
      apiParams.source_plugin_name__exact = textValue;
      break;
    case 'severity':
      apiParams.severity = textValue as AutoHealing.IncidentSeverity;
      break;
    case 'status':
      apiParams.status = textValue as AutoHealing.IncidentStatus;
      break;
    case 'healing_status':
      apiParams.healing_status = textValue as AutoHealing.HealingStatus;
      break;
    case 'scanned': {
      const scanned = toBooleanParam(value);
      if (scanned !== undefined) {
        apiParams.scanned = scanned;
      }
      break;
    }
    case 'has_plugin': {
      const hasPlugin = toBooleanParam(value);
      if (hasPlugin !== undefined) {
        apiParams.has_plugin = hasPlugin;
      }
      break;
    }
    case 'title__exact':
      apiParams.title__exact = textValue;
      break;
    default:
      apiParams.title = textValue;
      break;
  }
}

export function buildIncidentApiParams(params: IncidentRequestParams): IncidentQueryParams {
  const apiParams: IncidentQueryParams = {
    page: params.page,
    page_size: params.pageSize,
  };

  if (params.searchValue) {
    applyIncidentSearchParam(apiParams, params.searchField || 'title', params.searchValue);
  }

  if (params.advancedSearch) {
    Object.entries(params.advancedSearch as Record<string, unknown>).forEach(([field, value]) => {
      applyIncidentSearchParam(apiParams, field, value);
    });
  }

  if (params.sorter?.field) {
    apiParams.sort_by = params.sorter.field;
    apiParams.sort_order = params.sorter.order === 'ascend' ? 'asc' : 'desc';
  }

  return apiParams;
}
