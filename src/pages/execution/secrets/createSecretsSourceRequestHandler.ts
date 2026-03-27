import { getSecretsSources } from '@/services/auto-healing/secrets';
import { message } from 'antd';

type SecretsRequestParams = {
    page: number;
    pageSize: number;
    searchField?: string;
    searchValue?: string;
    advancedSearch?: Record<string, unknown>;
    sorter?: { field: string; order: 'ascend' | 'descend' };
};

type SecretsSourceQueryParams = NonNullable<Parameters<typeof getSecretsSources>[0]> & Record<string, unknown>;

export function createSecretsSourceRequestHandler() {
    return async (params: SecretsRequestParams) => {
        const apiParams: SecretsSourceQueryParams = {
            page: params.page,
            page_size: params.pageSize,
        };

        if (params.searchValue) {
            apiParams[params.searchField === 'name' ? 'name' : 'search'] = params.searchValue;
        }

        if (params.advancedSearch) {
            const search = params.advancedSearch;
            if (search.name) apiParams.name = String(search.name);
            if (search.type) apiParams.type = search.type as AutoHealing.SecretsSourceType;
            if (search.auth_type) apiParams.auth_type = String(search.auth_type);
            if (search.status) apiParams.status = String(search.status);
        }

        if (params.sorter) {
            apiParams.sort_by = params.sorter.field;
            apiParams.sort_order = params.sorter.order === 'ascend' ? 'asc' : 'desc';
        }

        try {
            const response = await getSecretsSources(apiParams);
            return { data: response.data || [], total: response.total || 0 };
        } catch (error) {
            message.error(error instanceof Error ? error.message : '加载密钥源列表失败');
            throw error;
        }
    };
}
