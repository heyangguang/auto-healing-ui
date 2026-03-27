import type { CMDBQueryParams, CMDBRequestParams } from './cmdbPageConfig';

function normalizeCMDBStatusValue(status: string) {
    return status === 'online' ? 'active' : status;
}

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

function applyCMDBSearchParam(
    apiParams: CMDBQueryParams,
    field: string,
    value: unknown,
) {
    if (value === undefined || value === null || value === '') {
        return;
    }

    const normalizedField = field.replace(/^__enum__/, '');
    const textValue = String(value);

    switch (normalizedField) {
        case 'ip_search':
        case 'ip_address':
            apiParams.ip_address = textValue;
            break;
        case 'ip_address__exact':
            apiParams.ip_address__exact = textValue;
            break;
        case 'host_search':
        case 'hostname':
            apiParams.hostname = textValue;
            break;
        case 'hostname__exact':
            apiParams.hostname__exact = textValue;
            break;
        case 'type':
            apiParams.type = textValue as AutoHealing.CMDBItemType;
            break;
        case 'status':
            apiParams.status = normalizeCMDBStatusValue(textValue) as AutoHealing.CMDBItemStatus;
            break;
        case 'environment':
            apiParams.environment = textValue as AutoHealing.CMDBEnvironment;
            break;
        case 'source_plugin_name':
            apiParams.source_plugin_name = textValue;
            break;
        case 'source_plugin_name__exact':
            apiParams.source_plugin_name__exact = textValue;
            break;
        case 'has_plugin': {
            const hasPlugin = toBooleanParam(value);
            if (hasPlugin !== undefined) {
                apiParams.has_plugin = hasPlugin;
            }
            break;
        }
        case 'name__exact':
            apiParams.name__exact = textValue;
            break;
        case 'name':
        default:
            apiParams.name = textValue;
            break;
    }
}

export function buildCMDBQueryParams(params: CMDBRequestParams): CMDBQueryParams {
    const apiParams: CMDBQueryParams = {
        page: params.page,
        page_size: params.pageSize,
    };

    if (params.searchValue) {
        applyCMDBSearchParam(apiParams, params.searchField || 'name', params.searchValue);
    }

    if (params.advancedSearch) {
        Object.entries(params.advancedSearch as Record<string, unknown>).forEach(([field, value]) => {
            applyCMDBSearchParam(apiParams, field, value);
        });
    }

    if (params.sorter?.field) {
        apiParams.sort_by = params.sorter.field;
        apiParams.sort_order = params.sorter.order === 'ascend' ? 'asc' : 'desc';
    }

    return apiParams;
}
