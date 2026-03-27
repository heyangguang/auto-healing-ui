import type {
    CommandBlacklistListParams,
    CommandBlacklistRule,
} from '@/services/auto-healing/commandBlacklist';

export type CommandBlacklistAdvancedSearch = {
    name?: string;
    name__exact?: string;
    pattern?: string;
    pattern__exact?: string;
    category?: string;
    severity?: CommandBlacklistRule['severity'];
    is_active?: string;
};

export type CommandBlacklistRequestParams = {
    page: number;
    pageSize: number;
    searchField?: string;
    searchValue?: string;
    advancedSearch?: CommandBlacklistAdvancedSearch;
    sorter?: { field: string; order: 'ascend' | 'descend' };
};

export type CommandBlacklistApiParams = CommandBlacklistListParams & {
    page: number;
    page_size: number;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
};

export const buildCommandBlacklistQuery = (
    params: CommandBlacklistRequestParams,
): CommandBlacklistApiParams => {
    const apiParams: CommandBlacklistApiParams = {
        page: params.page,
        page_size: params.pageSize,
    };

    if (params.searchValue) {
        apiParams.name = params.searchValue;
    }

    const advancedSearch = params.advancedSearch;
    if (advancedSearch) {
        if (advancedSearch.name) apiParams.name = advancedSearch.name;
        if (advancedSearch.name__exact) apiParams.name__exact = advancedSearch.name__exact;
        if (advancedSearch.pattern) apiParams.pattern = advancedSearch.pattern;
        if (advancedSearch.pattern__exact) apiParams.pattern__exact = advancedSearch.pattern__exact;
        if (advancedSearch.category) apiParams.category = advancedSearch.category;
        if (advancedSearch.severity) apiParams.severity = advancedSearch.severity;
        if (advancedSearch.is_active !== undefined && advancedSearch.is_active !== '') {
            apiParams.is_active = advancedSearch.is_active;
        }
    }

    if (params.sorter?.field && params.sorter.order) {
        apiParams.sort_by = params.sorter.field;
        apiParams.sort_order = params.sorter.order === 'ascend' ? 'asc' : 'desc';
    }

    return apiParams;
};

export const buildCommandBlacklistRequestSignature = (
    params: CommandBlacklistRequestParams,
) => JSON.stringify(buildCommandBlacklistQuery(params));
