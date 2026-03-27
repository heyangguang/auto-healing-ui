import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Empty, Pagination, Row, Spin, message } from 'antd';
import { useAccess } from '@umijs/max';
import StandardTable from '@/components/StandardTable';
import { deletePlatformRole, getPlatformRole, getPlatformRoleUsers, getPlatformRoles } from '@/services/auto-healing/roles';
import '../../../pages/execution/git-repos/index.css';
import './roles.css';
import RoleCard from './RoleCard';
import RoleDetailDrawer from './RoleDetailDrawer';
import RoleStatsBar from './RoleStatsBar';
import { applyPlatformRoleSearch, platformRoleSearchFields, platformRolesHeaderIcon } from './roleUtils';
import type { PlatformRoleRecord, PlatformRoleSearchParams, PlatformRoleUser, PlatformRoleUserPage } from './types';

const USER_PAGE_SIZE = 20;

const PlatformRolesPage: React.FC = () => {
    const access = useAccess();
    const [data, setData] = useState<PlatformRoleRecord[]>([]);
    const [loading, setLoading] = useState(false);
    const [listLoadFailed, setListLoadFailed] = useState(false);
    const [stats, setStats] = useState({ total: 0, system: 0 });
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(16);
    const [searchField, setSearchField] = useState<'display_name' | 'name'>('display_name');
    const [total, setTotal] = useState(0);
    const [searchValue, setSearchValue] = useState('');

    const [drawerOpen, setDrawerOpen] = useState(false);
    const [drawerRole, setDrawerRole] = useState<PlatformRoleRecord | null>(null);
    const [drawerRoleLoading, setDrawerRoleLoading] = useState(false);
    const [roleUsers, setRoleUsers] = useState<PlatformRoleUser[]>([]);
    const [roleUsersLoading, setRoleUsersLoading] = useState(false);
    const [roleUsersLoadFailed, setRoleUsersLoadFailed] = useState(false);
    const [roleUsersTotal, setRoleUsersTotal] = useState(0);
    const [userSearch, setUserSearch] = useState('');
    const [userPage, setUserPage] = useState(1);

    const currentRoleIdRef = useRef<string>('');
    const drawerRoleRequestSeqRef = useRef(0);
    const roleUsersRequestSeqRef = useRef(0);
    const listRequestSeqRef = useRef(0);

    const loadData = useCallback(async (nextPage: number, nextPageSize: number, value?: string, field: 'display_name' | 'name' = 'display_name') => {
        const requestSeq = listRequestSeqRef.current + 1;
        listRequestSeqRef.current = requestSeq;
        setLoading(true);
        setListLoadFailed(false);

        try {
            const keyword = value?.trim();
            const allRoles = await getPlatformRoles(keyword ? { name: keyword } : undefined);
            if (listRequestSeqRef.current !== requestSeq) {
                return;
            }
            const filteredRoles = applyPlatformRoleSearch(allRoles || [], value, field);
            setStats({
                total: filteredRoles.length,
                system: filteredRoles.filter((role) => role.is_system).length,
            });
            setTotal(filteredRoles.length);

            const start = (nextPage - 1) * nextPageSize;
            setData(filteredRoles.slice(start, start + nextPageSize));
        } catch {
            if (listRequestSeqRef.current === requestSeq) {
                setData([]);
                setTotal(0);
                setStats({ total: 0, system: 0 });
                setListLoadFailed(true);
                message.error('平台角色列表加载失败，请刷新页面重试');
            }
        } finally {
            if (listRequestSeqRef.current === requestSeq) {
                setLoading(false);
            }
        }
    }, []);

    const loadRoleUsers = useCallback(async (roleId: string, search: string, nextUserPage: number, append = false) => {
        const requestSeq = roleUsersRequestSeqRef.current + 1;
        roleUsersRequestSeqRef.current = requestSeq;
        setRoleUsersLoading(true);
        setRoleUsersLoadFailed(false);

        try {
            const response = await getPlatformRoleUsers(roleId, {
                page: nextUserPage,
                page_size: USER_PAGE_SIZE,
                ...(search ? { name: search } : {}),
            }) as PlatformRoleUserPage;
            if (roleUsersRequestSeqRef.current !== requestSeq || currentRoleIdRef.current !== roleId) {
                return;
            }
            const users = response.data || [];
            const nextTotal = Number(response.total || 0);
            setRoleUsers((previousUsers) => (append ? [...previousUsers, ...users] : users));
            setRoleUsersTotal(nextTotal);
        } catch {
            if (roleUsersRequestSeqRef.current === requestSeq && currentRoleIdRef.current === roleId) {
                setRoleUsers((previousUsers) => (append ? previousUsers : []));
                setRoleUsersTotal((previousTotal) => (append ? previousTotal : 0));
                setRoleUsersLoadFailed(true);
                message.error('角色关联用户加载失败，请刷新页面重试');
            }
        } finally {
            if (roleUsersRequestSeqRef.current === requestSeq && currentRoleIdRef.current === roleId) {
                setRoleUsersLoading(false);
            }
        }
    }, []);

    useEffect(() => {
        loadData(1, pageSize);
    }, []);

    const handleSearch = useCallback((params: PlatformRoleSearchParams) => {
        const quickFilter = params.filters?.[0];
        const nextSearchValue = quickFilter?.value || params.searchValue || '';
        const nextSearchField = (quickFilter?.field || params.searchField || 'display_name') as 'display_name' | 'name';
        setSearchField(nextSearchField);
        setSearchValue(nextSearchValue);
        setPage(1);
        loadData(1, pageSize, nextSearchValue, nextSearchField);
    }, [loadData, pageSize]);

    const openDrawer = useCallback((role: PlatformRoleRecord) => {
        const requestSeq = drawerRoleRequestSeqRef.current + 1;
        drawerRoleRequestSeqRef.current = requestSeq;
        setDrawerRole(role);
        setDrawerOpen(true);
        setDrawerRoleLoading(true);
        setRoleUsers([]);
        setRoleUsersLoading(false);
        setRoleUsersLoadFailed(false);
        setUserSearch('');
        setUserPage(1);
        setRoleUsersTotal(0);
        currentRoleIdRef.current = role.id;
        roleUsersRequestSeqRef.current += 1;

        getPlatformRole(role.id)
            .then((detail) => {
                if (drawerRoleRequestSeqRef.current !== requestSeq) {
                    return;
                }
                setDrawerRole(detail);
                if ((detail.user_count ?? 0) > 0) {
                    loadRoleUsers(detail.id, '', 1);
                    return;
                }
                setRoleUsers([]);
                setRoleUsersTotal(0);
            })
            .catch(() => {
                if (role.user_count && role.user_count > 0) {
                    loadRoleUsers(role.id, '', 1);
                }
            })
            .finally(() => {
                if (drawerRoleRequestSeqRef.current === requestSeq) {
                    setDrawerRoleLoading(false);
                }
            });
    }, [loadRoleUsers]);

    const closeDrawer = useCallback(() => {
        drawerRoleRequestSeqRef.current += 1;
        roleUsersRequestSeqRef.current += 1;
        setDrawerOpen(false);
        setDrawerRole(null);
        setDrawerRoleLoading(false);
        setRoleUsers([]);
        setRoleUsersLoading(false);
        setRoleUsersLoadFailed(false);
        setRoleUsersTotal(0);
        setUserSearch('');
        setUserPage(1);
        currentRoleIdRef.current = '';
    }, []);

    const handleUserSearch = useCallback((value: string) => {
        setUserSearch(value);
        setUserPage(1);
        setRoleUsers([]);
        if (currentRoleIdRef.current) {
            loadRoleUsers(currentRoleIdRef.current, value, 1);
        }
    }, [loadRoleUsers]);

    const handleLoadMore = useCallback(() => {
        const nextUserPage = userPage + 1;
        setUserPage(nextUserPage);
        if (currentRoleIdRef.current) {
            loadRoleUsers(currentRoleIdRef.current, userSearch, nextUserPage, true);
        }
    }, [loadRoleUsers, userPage, userSearch]);

    const handleDelete = useCallback(async (id: string) => {
        try {
            await deletePlatformRole(id);
            message.success('删除成功');
            const newTotal = Math.max(0, total - 1);
            const maxPage = Math.max(1, Math.ceil(newTotal / pageSize));
            const nextPage = Math.min(page, maxPage);
            setPage(nextPage);
            loadData(nextPage, pageSize, searchValue, searchField);
        } catch {
            /* global error handler */
        }
    }, [loadData, page, pageSize, searchField, searchValue, total]);

    return (
        <StandardTable<PlatformRoleRecord>
            title="平台角色管理"
            description="管理平台级角色及权限，平台角色用于控制平台管理功能的访问权限。"
            headerIcon={platformRolesHeaderIcon}
            headerExtra={<RoleStatsBar stats={stats} />}
            searchFields={platformRoleSearchFields}
            onSearch={handleSearch}
        >
            <Spin spinning={loading}>
                {data.length === 0 && !loading ? (
                    <Empty
                        style={{ padding: 60 }}
                        description={listLoadFailed ? '平台角色列表加载失败，请刷新页面重试' : '暂无平台角色'}
                    />
                ) : (
                    <>
                        <div className="roles-grid">
                            <Row gutter={[12, 12]}>
                                {data.map((role) => (
                                    <RoleCard
                                        key={role.id}
                                        role={role}
                                        canManagePlatformRoles={access.canManagePlatformRoles}
                                        onOpen={openDrawer}
                                        onDelete={handleDelete}
                                    />
                                ))}
                            </Row>
                        </div>
                        {total > pageSize && (
                            <div className="roles-pagination">
                                <Pagination
                                    current={page}
                                    pageSize={pageSize}
                                    total={total}
                                    showSizeChanger
                                    showTotal={(itemsTotal) => `共 ${itemsTotal} 条`}
                                    pageSizeOptions={['8', '16', '24', '32']}
                                    onChange={(nextPage, nextPageSize) => {
                                        const resolvedPageSize = nextPageSize || pageSize;
                                        setPage(nextPage);
                                        setPageSize(resolvedPageSize);
                                        loadData(nextPage, resolvedPageSize, searchValue, searchField);
                                    }}
                                />
                            </div>
                        )}
                    </>
                )}
            </Spin>
            <RoleDetailDrawer
                open={drawerOpen}
                role={drawerRole}
                roleLoading={drawerRoleLoading}
                users={roleUsers}
                usersLoading={roleUsersLoading}
                usersLoadFailed={roleUsersLoadFailed}
                usersTotal={roleUsersTotal}
                userSearch={userSearch}
                onClose={closeDrawer}
                onUserSearch={handleUserSearch}
                onLoadMore={handleLoadMore}
            />
        </StandardTable>
    );
};

export default PlatformRolesPage;
