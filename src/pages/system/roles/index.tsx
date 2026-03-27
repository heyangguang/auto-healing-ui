import React, { useCallback, useRef, useState } from 'react';
import { history, useAccess } from '@umijs/max';
import { PlusOutlined } from '@ant-design/icons';
import StandardTable from '@/components/StandardTable';
import { getRole, getRoles } from '@/services/auto-healing/roles';
import { getRoleWorkspaces, listSystemWorkspaces } from '@/services/auto-healing/dashboard';
import RoleDetailDrawer from './RoleDetailDrawer';
import RoleTableColumns from './RoleTableColumns';
import {
    getRoleKeywordFilter,
    roleSearchFields,
    rolesHeaderIcon,
    type RoleDrawerDetail,
    type RoleRequestParams,
    type WorkspaceSummary,
} from './rolePageTypes';

const RolesPage: React.FC = () => {
    const access = useAccess();
    const refreshCountRef = useRef(0);
    const [, forceUpdate] = useState(0);
    const detailRequestSeqRef = useRef(0);

    const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
    const [detailRole, setDetailRole] = useState<RoleDrawerDetail | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);

    const triggerRefresh = useCallback(() => {
        refreshCountRef.current += 1;
        forceUpdate((current) => current + 1);
    }, []);

    const closeDetailDrawer = useCallback(() => {
        detailRequestSeqRef.current += 1;
        setDetailDrawerOpen(false);
        setDetailLoading(false);
        setDetailRole(null);
    }, []);

    const openDetailDrawer = useCallback(async (record: AutoHealing.RoleWithStats) => {
        const requestSeq = detailRequestSeqRef.current + 1;
        detailRequestSeqRef.current = requestSeq;
        setDetailRole(record);
        setDetailDrawerOpen(true);
        setDetailLoading(true);

        try {
            const [roleResponse, workspaceIdsResponse, workspaceListResponse] = await Promise.all([
                getRole(record.id),
                getRoleWorkspaces(record.id).catch(() => null),
                listSystemWorkspaces().catch(() => null),
            ]);
            if (detailRequestSeqRef.current !== requestSeq) {
                return;
            }

            const workspaceIds: string[] = workspaceIdsResponse?.workspace_ids || [];
            const workspaceList = (workspaceListResponse || []) as WorkspaceSummary[];
            const explicitWorkspaceNames = workspaceIds
                .map((workspaceId) => workspaceList.find((workspace) => workspace.id === workspaceId)?.name)
                .filter((workspaceName): workspaceName is string => Boolean(workspaceName));
            const defaultWorkspaceNames = workspaceList
                .filter((workspace) => workspace.is_default)
                .map((workspace) => workspace.name)
                .filter(Boolean);

            setDetailRole({
                ...roleResponse,
                _workspaceNames: Array.from(new Set([...defaultWorkspaceNames, ...explicitWorkspaceNames])),
            });
        } catch {
            /* global error handler */
        } finally {
            if (detailRequestSeqRef.current === requestSeq) {
                setDetailLoading(false);
            }
        }
    }, []);

    const handleRequest = useCallback(async (params: RoleRequestParams) => {
        const response = await getRoles({ name: getRoleKeywordFilter(params) });
        let items: AutoHealing.RoleWithStats[] = response || [];

        const skipQuickSearch = params.searchField === 'is_system';
        const searchValue = skipQuickSearch ? '' : params.searchValue?.trim().toLowerCase();
        if (searchValue) {
            items = items.filter((item) => {
                if (params.searchField === 'display_name') {
                    return (item.display_name || '').toLowerCase().includes(searchValue);
                }
                if (params.searchField === 'name') {
                    return (item.name || '').toLowerCase().includes(searchValue);
                }
                return (
                    (item.display_name || '').toLowerCase().includes(searchValue) ||
                    (item.name || '').toLowerCase().includes(searchValue) ||
                    (item.description || '').toLowerCase().includes(searchValue)
                );
            });
        }

        if (params.advancedSearch) {
            const advancedSearch = params.advancedSearch;
            if (advancedSearch.is_system !== undefined && advancedSearch.is_system !== '') {
                const isSystem = advancedSearch.is_system === 'true';
                items = items.filter((item) => item.is_system === isSystem);
            }

            const specialKeys = ['is_system'];
            Object.entries(advancedSearch).forEach(([key, value]) => {
                if (specialKeys.includes(key) || value === undefined || value === null || value === '') {
                    return;
                }
                const isExact = key.endsWith('__exact');
                const fieldName = isExact ? key.replace(/__exact$/, '') : key;
                const valueText = String(value);
                if (isExact) {
                    items = items.filter((item) => String(item[fieldName as keyof AutoHealing.RoleWithStats] || '') === valueText);
                    return;
                }
                items = items.filter((item) =>
                    String(item[fieldName as keyof AutoHealing.RoleWithStats] || '')
                        .toLowerCase()
                        .includes(valueText.toLowerCase()));
            });
        }

        if (params.sorter) {
            const { field, order } = params.sorter;
            const sortField = field as keyof AutoHealing.RoleWithStats;
            items.sort((left, right) => {
                const leftValue = left[sortField] ?? '';
                const rightValue = right[sortField] ?? '';
                const compareResult = typeof leftValue === 'number' && typeof rightValue === 'number'
                    ? leftValue - rightValue
                    : String(leftValue).localeCompare(String(rightValue));
                return order === 'ascend' ? compareResult : -compareResult;
            });
        }

        const total = items.length;
        const startIndex = (params.page - 1) * params.pageSize;
        return { data: items.slice(startIndex, startIndex + params.pageSize), total };
    }, []);

    return (
        <>
            <StandardTable<AutoHealing.RoleWithStats>
                key={refreshCountRef.current}
                tabs={[{ key: 'list', label: '角色列表' }]}
                title="角色管理"
                description="管理系统角色、权限分配。支持创建自定义角色、分配权限，系统角色不可删除。"
                headerIcon={rolesHeaderIcon}
                searchFields={roleSearchFields}
                primaryActionLabel="创建角色"
                primaryActionIcon={<PlusOutlined />}
                primaryActionDisabled={!access.canCreateRole}
                onPrimaryAction={() => history.push('/system/roles/create')}
                columns={RoleTableColumns({ access, onOpenDetail: openDetailDrawer, onRefresh: triggerRefresh })}
                rowKey="id"
                onRowClick={openDetailDrawer}
                request={handleRequest}
                defaultPageSize={10}
                preferenceKey="role_list"
            />
            <RoleDetailDrawer
                open={detailDrawerOpen}
                role={detailRole}
                loading={detailLoading}
                access={access}
                onClose={closeDetailDrawer}
                onDeleted={triggerRefresh}
            />
        </>
    );
};

export default RolesPage;
