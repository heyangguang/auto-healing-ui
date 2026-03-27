import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
    Button, Space, Tooltip, message,
    Popconfirm, Spin, Empty, Pagination, Row, Col, Typography,
    Drawer, Tag, Badge, Avatar, Input,
} from 'antd';
import {
    DeleteOutlined,
    SafetyCertificateOutlined, TeamOutlined,
    ClockCircleOutlined, SecurityScanOutlined,
    IdcardOutlined, CloseOutlined, UserOutlined,
    SearchOutlined,
} from '@ant-design/icons';
import { useAccess } from '@umijs/max';
import StandardTable from '@/components/StandardTable';
import type { SearchField } from '@/components/StandardTable';
import { getPlatformRoles, deletePlatformRole, getPlatformRole, getPlatformRoleUsers } from '@/services/auto-healing/roles';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';
import './roles.css';
import '../../../pages/execution/git-repos/index.css';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

const { Text } = Typography;

import { PERMISSION_MODULE_LABELS as MODULE_LABELS } from '@/constants/permissionDicts';

type PlatformRoleRecord = AutoHealing.RoleWithStats & {
    updated_at?: string;
};

type PlatformRoleUser = {
    id: string;
    username: string;
    display_name: string;
    email: string;
    status: 'active' | 'inactive';
};

type PlatformRoleSearchParams = {
    searchField?: string;
    searchValue?: string;
    advancedSearch?: Record<string, string | undefined>;
    filters?: { field: string; value: string }[];
};

type PlatformRoleUserPage = AutoHealing.PaginatedResponse<PlatformRoleUser>;

const searchFields: SearchField[] = [
    { key: 'display_name', label: '角色名称' },
    { key: 'name', label: '角色标识' },
];

function applyPlatformRoleSearch(
    roles: PlatformRoleRecord[],
    value?: string,
    field: 'display_name' | 'name' = 'display_name',
) {
    const keyword = value?.trim().toLowerCase();
    if (!keyword) {
        return roles;
    }
    return roles.filter((role) => {
        const target = field === 'name' ? role.name : role.display_name || '';
        return target.toLowerCase().includes(keyword);
    });
}

const headerIcon = (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
        <circle cx="24" cy="20" r="8" stroke="currentColor" strokeWidth="2" fill="none" />
        <path d="M12 44c0-8 5.4-14 12-14s12 6 12 14" stroke="currentColor" strokeWidth="2" fill="none" />
        <path d="M34 8l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <rect x="30" y="14" width="12" height="8" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none" />
    </svg>
);

/* ==================================================================
   平台角色管理页 — 石板蓝灰卡片 + 权限详情抽屉
   ================================================================== */
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

    // Drawer
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [drawerRole, setDrawerRole] = useState<PlatformRoleRecord | null>(null);
    const [drawerRoleLoading, setDrawerRoleLoading] = useState(false);
    const [roleUsers, setRoleUsers] = useState<PlatformRoleUser[]>([]);
    const [roleUsersLoading, setRoleUsersLoading] = useState(false);
    const [roleUsersLoadFailed, setRoleUsersLoadFailed] = useState(false);
    const [roleUsersTotal, setRoleUsersTotal] = useState(0);
    const [userSearch, setUserSearch] = useState('');
    const [userPage, setUserPage] = useState(1);
    const userPageSize = 20;
    const currentRoleIdRef = useRef<string>('');
    const drawerRoleRequestSeqRef = useRef(0);
    const roleUsersRequestSeqRef = useRef(0);
    const listRequestSeqRef = useRef(0);

    const loadData = useCallback(async (p: number, ps: number, value?: string, field: 'display_name' | 'name' = 'display_name') => {
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
            const list = applyPlatformRoleSearch(allRoles || [], value, field);
            setStats({
                total: list.length,
                system: list.filter(role => role.is_system).length,
            });

            const tot = list.length;
            setTotal(tot);

            // 前端分页
            const start = (p - 1) * ps;
            setData(list.slice(start, start + ps));
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

    useEffect(() => {
        loadData(1, pageSize);
    }, []);

    const handleSearch = useCallback((params: PlatformRoleSearchParams) => {
        const quickFilter = params.filters?.[0];
        const value = quickFilter?.value || params.searchValue || '';
        const field = (quickFilter?.field || params.searchField || 'display_name') as 'display_name' | 'name';
        setSearchField(field);
        setSearchValue(value);
        setPage(1);
        loadData(1, pageSize, value, field);
    }, [pageSize, loadData]);

    // ==================== Drawer ====================
    const loadRoleUsers = useCallback(async (roleId: string, search: string, page: number, append = false) => {
        const requestSeq = roleUsersRequestSeqRef.current + 1;
        roleUsersRequestSeqRef.current = requestSeq;
        setRoleUsersLoading(true);
        setRoleUsersLoadFailed(false);
        try {
            const res = await getPlatformRoleUsers(roleId, {
                page,
                page_size: userPageSize,
                ...(search ? { name: search } : {}),
            }) as PlatformRoleUserPage;
            if (roleUsersRequestSeqRef.current !== requestSeq || currentRoleIdRef.current !== roleId) {
                return;
            }
            const list = res.data || [];
            const tot = Number(res.total || 0);
            setRoleUsers(prev => append ? [...prev, ...list] : list);
            setRoleUsersTotal(tot);
        } catch {
            if (roleUsersRequestSeqRef.current === requestSeq && currentRoleIdRef.current === roleId) {
                setRoleUsers((prev) => (append ? prev : []));
                setRoleUsersTotal((prev) => (append ? prev : 0));
                setRoleUsersLoadFailed(true);
                message.error('角色关联用户加载失败，请刷新页面重试');
            }
        } finally {
            if (roleUsersRequestSeqRef.current === requestSeq && currentRoleIdRef.current === roleId) {
                setRoleUsersLoading(false);
            }
        }
    }, []);

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
                if (drawerRoleRequestSeqRef.current !== requestSeq) return;
                setDrawerRole(detail);
                if ((detail.user_count ?? 0) > 0) {
                    loadRoleUsers(detail.id, '', 1);
                    return;
                }
                setRoleUsers([]);
                setRoleUsersTotal(0);
            })
            .catch(() => {
                if (role.user_count > 0) {
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
        const nextPage = userPage + 1;
        setUserPage(nextPage);
        if (currentRoleIdRef.current) {
            loadRoleUsers(currentRoleIdRef.current, userSearch, nextPage, true);
        }
    }, [userPage, userSearch, loadRoleUsers]);

    // ==================== 删除 ====================
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
    }, [page, pageSize, searchValue, searchField, loadData, total]);

    // ==================== 权限分组 ====================
    const groupPermissions = (perms: AutoHealing.Permission[]) => {
        const groups: Record<string, AutoHealing.Permission[]> = {};
        for (const p of perms) {
            const mod = p.module || 'other';
            if (!groups[mod]) groups[mod] = [];
            groups[mod].push(p);
        }
        return groups;
    };

    // ==================== 渲染卡片 ====================
    const renderCard = (role: PlatformRoleRecord) => {
        const isSystem = role.is_system;
        const cardClass = `role-card ${isSystem ? 'role-card-system' : 'role-card-custom'}`;

        return (
            <Col key={role.id} xs={24} sm={12} md={8} lg={6} xl={6} xxl={4}>
                <div className={cardClass} onClick={() => openDrawer(role)}>
                    <div className="role-card-body">
                        {/* 标题行 */}
                        <div className="role-card-header">
                            <div className="role-card-title-area">
                                <div className="role-card-icon">
                                    <SafetyCertificateOutlined />
                                </div>
                                <span className="role-card-title">
                                    {role.display_name || role.name}
                                </span>
                            </div>
                            <span className={isSystem ? 'role-card-type-system' : 'role-card-type-custom'}>
                                {isSystem ? '系统' : '自定义'}
                            </span>
                        </div>

                        {/* 描述 */}
                        <div className="role-card-desc">
                            {role.description || '暂无描述'}
                        </div>

                        {/* 统计 */}
                        <div className="role-card-stats">
                            <div className="role-card-stat-item">
                                <TeamOutlined />
                                <span>用户</span>
                                <span className="role-card-stat-value">{role.user_count ?? 0}</span>
                            </div>
                            <div className="role-card-stat-item">
                                <SecurityScanOutlined />
                                <span>权限</span>
                                <span className="role-card-stat-value">{role.permission_count ?? 0}</span>
                            </div>
                        </div>

                        {/* 底部 */}
                        <div className="role-card-footer">
                            <div className="role-card-footer-left">
                                <ClockCircleOutlined style={{ fontSize: 10 }} />
                                {role.created_at ? dayjs(role.created_at).fromNow() : '-'}
                            </div>
                            <Space size={0}>
                                {!isSystem && access.canManagePlatformRoles && (
                                    <>
                                        <Popconfirm
                                            title="确定要删除此角色吗？"
                                            description="删除后不可恢复"
                                            onConfirm={(e) => {
                                                e?.stopPropagation();
                                                handleDelete(role.id);
                                            }}
                                            onCancel={(e) => e?.stopPropagation()}
                                        >
                                            <Tooltip title="删除">
                                                <Button
                                                    type="link" size="small" danger
                                                    icon={<DeleteOutlined />}
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            </Tooltip>
                                        </Popconfirm>
                                    </>
                                )}
                            </Space>
                        </div>
                    </div>
                </div>
            </Col>
        );
    };

    // ==================== Drawer 内容 ====================
    const renderDrawer = () => {
        if (!drawerRole) return null;
        const perms = drawerRole.permissions || [];
        const grouped = groupPermissions(perms);

        return (
            <Drawer
                open={drawerOpen}
                onClose={closeDrawer}
                width={520}
                title={null}
                closable={false}
                styles={{
                    body: { padding: 0, background: '#fafafa' },
                    header: { display: 'none' },
                }}
            >
                <Spin spinning={drawerRoleLoading}>
                    {/* Header */}
                    <div className="role-drawer-header">
                        <div className="role-drawer-header-top">
                            <div className="role-drawer-header-icon">
                                <SafetyCertificateOutlined />
                            </div>
                            <div className="role-drawer-header-info">
                                <div className="role-drawer-title">{drawerRole.display_name}</div>
                                <div className="role-drawer-sub">
                                    <IdcardOutlined style={{ marginRight: 4 }} />
                                    {drawerRole.name}
                                </div>
                            </div>
                            <Button
                                type="text"
                                icon={<CloseOutlined />}
                                onClick={closeDrawer}
                                style={{ flexShrink: 0, color: '#8c8c8c' }}
                            />
                        </div>
                    </div>

                    <div className="role-drawer-body">
                    {/* 基本信息 */}
                    <div className="role-drawer-card">
                        <div className="role-drawer-card-header">
                            <Space size={6}>
                                <SafetyCertificateOutlined className="role-drawer-card-header-icon" />
                                <span className="role-drawer-card-header-title">基本信息</span>
                            </Space>
                        </div>
                        <div className="role-drawer-card-body">
                            <div className="role-drawer-grid">
                                <div className="role-drawer-field">
                                    <span className="role-drawer-field-label">角色名称</span>
                                    <span className="role-drawer-field-value">{drawerRole.display_name}</span>
                                </div>
                                <div className="role-drawer-field">
                                    <span className="role-drawer-field-label">角色标识</span>
                                    <span className="role-drawer-field-value" style={{ fontFamily: 'monospace' }}>
                                        {drawerRole.name}
                                    </span>
                                </div>
                                <div className="role-drawer-field">
                                    <span className="role-drawer-field-label">类型</span>
                                    <span className="role-drawer-field-value">
                                        <Tag color={drawerRole.is_system ? 'blue' : 'default'}>
                                            {drawerRole.is_system ? '系统角色' : '自定义角色'}
                                        </Tag>
                                    </span>
                                </div>
                                <div className="role-drawer-field">
                                    <span className="role-drawer-field-label">作用域</span>
                                    <span className="role-drawer-field-value">
                                        <Tag color="purple">平台级</Tag>
                                    </span>
                                </div>
                                <div className="role-drawer-field">
                                    <span className="role-drawer-field-label">用户数</span>
                                    <span className="role-drawer-field-value">
                                        <Badge
                                            count={drawerRole.user_count ?? 0}
                                            showZero
                                            color={drawerRole.user_count > 0 ? '#1677ff' : '#d9d9d9'}
                                        />
                                    </span>
                                </div>
                                <div className="role-drawer-field">
                                    <span className="role-drawer-field-label">权限数</span>
                                    <span className="role-drawer-field-value">
                                        <Badge
                                            count={drawerRole.permission_count ?? 0}
                                            showZero
                                            color={drawerRole.permission_count > 0 ? '#52c41a' : '#d9d9d9'}
                                        />
                                    </span>
                                </div>
                                <div className="role-drawer-field" style={{ gridColumn: '1 / -1' }}>
                                    <span className="role-drawer-field-label">描述</span>
                                    <span className="role-drawer-field-value">
                                        {drawerRole.description || '-'}
                                    </span>
                                </div>
                                <div className="role-drawer-field">
                                    <span className="role-drawer-field-label">创建时间</span>
                                    <span className="role-drawer-field-value">
                                        {drawerRole.created_at ? dayjs(drawerRole.created_at).format('YYYY-MM-DD HH:mm:ss') : '-'}
                                    </span>
                                </div>
                                <div className="role-drawer-field">
                                    <span className="role-drawer-field-label">更新时间</span>
                                    <span className="role-drawer-field-value">
                                        {drawerRole.updated_at ? dayjs(drawerRole.updated_at).format('YYYY-MM-DD HH:mm:ss') : '-'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 关联用户 */}
                    <div className="role-drawer-card">
                        <div className="role-drawer-card-header">
                            <Space size={6}>
                                <TeamOutlined className="role-drawer-card-header-icon" />
                                <span className="role-drawer-card-header-title">
                                    关联用户 ({drawerRole.user_count ?? 0})
                                </span>
                            </Space>
                        </div>
                        <div className="role-drawer-card-body">
                            {/* 搜索框 — 仅当有用户时显示 */}
                            {(drawerRole.user_count > 0) && (
                                <Input.Search
                                    placeholder="搜索用户名 / 显示名"
                                    allowClear
                                    size="small"
                                    prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                                    onSearch={handleUserSearch}
                                    style={{ marginBottom: 8 }}
                                />
                            )}

                            {roleUsersLoading && roleUsers.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: 16 }}>
                                    <Spin size="small" />
                                </div>
                            ) : roleUsers.length === 0 && !roleUsersLoading ? (
                                <Empty
                                    description={
                                        roleUsersLoadFailed
                                            ? '关联用户加载失败，请刷新页面重试'
                                            : userSearch
                                                ? '未找到匹配用户'
                                                : '暂无关联用户'
                                    }
                                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                                />
                            ) : (
                                <>
                                    <div className="role-users-scroll">
                                        {roleUsers.map((user) => (
                                            <div className="role-user-row" key={user.id}>
                                                <Avatar
                                                    size={28}
                                                    icon={<UserOutlined />}
                                                    style={{ background: '#6B7A90', flexShrink: 0 }}
                                                />
                                                <div className="role-user-info">
                                                    <div className="role-user-name">
                                                        {user.display_name || user.username}
                                                    </div>
                                                    <div className="role-user-meta">
                                                        {user.username}
                                                        {user.email ? ` · ${user.email}` : ''}
                                                    </div>
                                                </div>
                                                <Tag
                                                    color={user.status === 'active' ? 'green' : 'default'}
                                                    style={{ fontSize: 11, margin: 0, flexShrink: 0 }}
                                                >
                                                    {user.status === 'active' ? '活跃' : '未激活'}
                                                </Tag>
                                            </div>
                                        ))}
                                    </div>
                                    {/* 加载更多 */}
                                    {roleUsers.length < roleUsersTotal && (
                                        <div style={{ textAlign: 'center', padding: '8px 0 0' }}>
                                            <Button
                                                type="link"
                                                size="small"
                                                loading={roleUsersLoading}
                                                onClick={handleLoadMore}
                                            >
                                                加载更多 ({roleUsers.length}/{roleUsersTotal})
                                            </Button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    {/* 权限列表 */}
                    <div className="role-drawer-card">
                        <div className="role-drawer-card-header">
                            <Space size={6}>
                                <SecurityScanOutlined className="role-drawer-card-header-icon" />
                                <span className="role-drawer-card-header-title">
                                    权限列表 ({perms.length})
                                </span>
                            </Space>
                        </div>
                        <div className="role-drawer-card-body">
                            {Object.keys(grouped).length === 0 ? (
                                <Empty description="暂无权限" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                            ) : (
                                Object.entries(grouped).map(([mod, modulePerms]) => (
                                    <div key={mod} style={{ marginBottom: 12 }}>
                                        <Text strong style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 4, display: 'block' }}>
                                            {MODULE_LABELS[mod] || mod}
                                        </Text>
                                        <div className="role-perm-list">
                                            {modulePerms.map((p) => (
                                                <span key={p.code} className="role-perm-tag">
                                                    {p.name || p.code}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                    </div>
                </Spin>
            </Drawer>
        );
    };

    // ==================== 统计栏 ====================
    const statsBar = useMemo(() => {
        const items = [
            { icon: <SafetyCertificateOutlined />, cls: 'total', val: stats.total, lbl: '全部' },
            { icon: <SecurityScanOutlined />, cls: 'ready', val: stats.system, lbl: '系统角色' },
        ];
        return (
            <div className="git-stats-bar">
                {items.map((s, i) => (
                    <React.Fragment key={i}>
                        {i > 0 && <div className="git-stat-divider" />}
                        <div className="git-stat-item">
                            <span className={`git-stat-icon git-stat-icon-${s.cls}`}>{s.icon}</span>
                            <div className="git-stat-content">
                                <div className="git-stat-value">{s.val}</div>
                                <div className="git-stat-label">{s.lbl}</div>
                            </div>
                        </div>
                    </React.Fragment>
                ))}
            </div>
        );
    }, [stats]);

    // ==================== 主渲染 ====================
    return (
        <StandardTable<PlatformRoleRecord>
            title="平台角色管理"
            description="管理平台级角色及权限，平台角色用于控制平台管理功能的访问权限。"
            headerIcon={headerIcon}
            headerExtra={statsBar}
            searchFields={searchFields}
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
                                {data.map(renderCard)}
                            </Row>
                        </div>
                        {total > pageSize && (
                            <div className="roles-pagination">
                                <Pagination
                                    current={page}
                                    pageSize={pageSize}
                                    total={total}
                                    showSizeChanger
                                    showTotal={(t) => `共 ${t} 条`}
                                    pageSizeOptions={['8', '16', '24', '32']}
                                    onChange={(p, ps) => {
                                        setPage(p);
                                        setPageSize(ps || pageSize);
                                        loadData(p, ps || pageSize, searchValue, searchField);
                                    }}
                                />
                            </div>
                        )}
                    </>
                )}
            </Spin>

            {renderDrawer()}
        </StandardTable>
    );
};

export default PlatformRolesPage;
