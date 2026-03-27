import { getGitRepos } from '@/services/auto-healing/git-repos';
import { message } from 'antd';
import { toDayRangeEndISO, toDayRangeStartISO } from '@/utils/dateRange';
import type { GitReposQueryParams, GitReposRequestParams } from './gitRepoListMeta';

export function createGitRepoRequestHandler() {
    return async (params: GitReposRequestParams) => {
        const apiParams: GitReposQueryParams = {
            page: params.page,
            page_size: params.pageSize,
        };

        if (params.searchValue) {
            if (params.searchField === 'url') apiParams.url = params.searchValue;
            else apiParams.name = params.searchValue;
        }

        if (params.advancedSearch) {
            const search = params.advancedSearch;
            if (search.created_at?.[0] && search.created_at?.[1]) {
                apiParams.created_from = toDayRangeStartISO(search.created_at[0]);
                apiParams.created_to = toDayRangeEndISO(search.created_at[1]);
            }
            if (search.name) apiParams.name = search.name;
            if (search.url) apiParams.url = search.url;
            if (search.status) apiParams.status = search.status;
            if (search.auth_type) apiParams.auth_type = search.auth_type;
        }

        if (params.sorter) {
            apiParams.sort_by = params.sorter.field;
            apiParams.sort_order = params.sorter.order === 'ascend' ? 'asc' : 'desc';
        }

        try {
            const response = await getGitRepos(apiParams);
            return { data: response.data || [], total: response.total || 0 };
        } catch (error) {
            message.error(error instanceof Error ? error.message : '加载仓库列表失败');
            throw error;
        }
    };
}
