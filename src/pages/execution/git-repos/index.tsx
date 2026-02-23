import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    PlusOutlined, SyncOutlined, BranchesOutlined, GithubOutlined, GitlabOutlined, DeleteOutlined,
    CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined, KeyOutlined, LockOutlined,
    SafetyCertificateOutlined, GlobalOutlined, FolderOutlined, FileOutlined, ReloadOutlined,
    ExclamationCircleOutlined, CloudSyncOutlined, HistoryOutlined, CodeOutlined, SettingOutlined,
    InfoCircleOutlined, LinkOutlined, FileTextOutlined, RightOutlined,
} from '@ant-design/icons';
import { useAccess, history } from '@umijs/max';
import {
    Button, message, Space, Tag, Tooltip, Drawer, Typography, Tabs,
    Empty, Alert, Modal, Table, Spin, Badge, Popconfirm,
} from 'antd';
import type { DataNode } from 'antd/es/tree';
import { Tree } from 'antd';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';
import StandardTable from '@/components/StandardTable';
import type { StandardColumnDef, SearchField, AdvancedSearchField } from '@/components/StandardTable';
import {
    getGitRepos, getGitRepo, deleteGitRepo, syncGitRepo,
    getFiles, getCommits, getSyncLogs, getGitRepoStats,
} from '@/services/auto-healing/git-repos';
import { getPlaybooks } from '@/services/auto-healing/playbooks';
import { REPO_STATUS_OPTIONS, AUTH_TYPE_OPTIONS, SYNC_ENABLED_OPTIONS } from '@/constants/gitRepoDicts';
import './index.css';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

const { Text } = Typography;

// ============ 配置 ============
const statusConfig: Record<string, { text: string; color: string; icon: React.ReactNode; badge: 'success' | 'default' | 'error' | 'processing' }> = {
    pending: { text: '待同步', color: 'default', icon: <ClockCircleOutlined />, badge: 'default' },
    ready: { text: '就绪', color: 'success', icon: <CheckCircleOutlined />, badge: 'success' },
    syncing: { text: '同步中', color: 'processing', icon: <SyncOutlined spin />, badge: 'processing' },
    error: { text: '错误', color: 'error', icon: <CloseCircleOutlined />, badge: 'error' },
};

const authLabels: Record<string, { icon: React.ReactNode; text: string }> = {
    none: { icon: <GlobalOutlined />, text: '公开' },
    token: { icon: <KeyOutlined />, text: 'Token' },
    password: { icon: <LockOutlined />, text: '密码' },
    ssh_key: { icon: <SafetyCertificateOutlined />, text: 'SSH' },
};

// ============ 搜索 ============
const searchFields: SearchField[] = [
    { key: 'search', label: '名称/URL' },
    { key: 'name', label: '名称' },
    { key: 'url', label: '仓库地址' },
];

const advancedSearchFields: AdvancedSearchField[] = [
    { key: 'name', label: '仓库名称', type: 'input', placeholder: '输入仓库名称' },
    { key: 'url', label: '仓库地址', type: 'input', placeholder: '输入仓库 URL' },
    {
        key: 'status', label: '状态', type: 'select', options: REPO_STATUS_OPTIONS,
    },
    {
        key: 'auth_type', label: '认证方式', type: 'select', options: AUTH_TYPE_OPTIONS,
    },
    {
        key: 'sync_enabled', label: '定时同步', type: 'select', options: SYNC_ENABLED_OPTIONS,
    },
    { key: 'created_at', label: '创建时间', type: 'dateRange' },
];

const headerIcon = (
    <svg viewBox="0 0 48 48" fill="none">
        <rect x="8" y="8" width="32" height="32" rx="4" stroke="currentColor" strokeWidth="2" fill="none" />
        <path d="M18 18v12M18 30l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M28 30h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
);

// ============ Git 平台自动检测 ============
const BitbucketIcon = () => (
    <svg viewBox="0 0 1024 1024" width="1em" height="1em" fill="currentColor">
        <path d="M575.2 588.8l-62.4-198.4h-2.4l-60 198.4h124.8zM149.6 128c-19.2 0-33.6 16-32 35.2l96 684.8c2.4 16 16 28.8 32 30.4h540.8c12 0 22.4-8.8 24-20.8l96-694.4c1.6-19.2-12.8-35.2-32-35.2H149.6zm420.8 508.8H453.6L408 428.8h210.4l-48 208z" />
    </svg>
);

const GiteeIcon = () => (
    <svg viewBox="0 0 1024 1024" width="1em" height="1em" fill="currentColor">
        <path d="M512 1024C229.2 1024 0 794.8 0 512S229.2 0 512 0s512 229.2 512 512-229.2 512-512 512zm259.1-568.9H480.7c-15.8 0-28.6 12.8-28.6 28.6v57.1c0 15.8 12.8 28.6 28.6 28.6h176.8c15.8 0 28.6 12.8 28.6 28.6v14.3c0 47.3-38.4 85.7-85.7 85.7H366.7a28.6 28.6 0 0 1-28.6-28.6V416c0-47.3 38.4-85.7 85.7-85.7h347.3c15.8 0 28.6-12.8 28.6-28.6v-57.1c0-15.8-12.8-28.6-28.6-28.6H423.9c-94.7 0-171.4 76.8-171.4 171.4v275.5c0 15.8 12.8 28.6 28.6 28.6h344.6c85.2 0 154.3-69.1 154.3-154.3V483.7c0-15.8-12.8-28.6-28.6-28.6h-.3z" />
    </svg>
);

const AzureIcon = () => (
    <svg viewBox="0 0 1024 1024" width="1em" height="1em" fill="currentColor">
        <path d="M388.8 131.2L153.6 460.8l-128 355.2h230.4L388.8 131.2zm48 0L307.2 816h432L563.2 358.4l-126.4-227.2zM768 816h230.4L588.8 131.2 768 816z" />
    </svg>
);

type ProviderInfo = { icon: React.ReactNode; color: string; bg: string; label: string };

const getProviderInfo = (url: string): ProviderInfo => {
    const lower = (url || '').toLowerCase();
    if (lower.includes('github.com') || lower.includes('github.')) {
        return { icon: <GithubOutlined />, color: '#24292f', bg: '#f5f5f5', label: 'GitHub' };
    }
    if (lower.includes('gitlab.com') || lower.includes('gitlab.') || lower.includes('gitlab/')) {
        return { icon: <GitlabOutlined />, color: '#e24329', bg: '#fef0ed', label: 'GitLab' };
    }
    if (lower.includes('bitbucket.org') || lower.includes('bitbucket.')) {
        return { icon: <BitbucketIcon />, color: '#0052cc', bg: '#e6f0ff', label: 'Bitbucket' };
    }
    if (lower.includes('gitee.com') || lower.includes('gitee.')) {
        return { icon: <GiteeIcon />, color: '#c71d23', bg: '#fef0f0', label: 'Gitee' };
    }
    if (lower.includes('dev.azure.com') || lower.includes('visualstudio.com')) {
        return { icon: <AzureIcon />, color: '#0078d4', bg: '#e6f2ff', label: 'Azure' };
    }
    // 通用 Git
    return { icon: <BranchesOutlined />, color: '#595959', bg: '#f5f5f5', label: 'Git' };
};

// ============ 主组件 ============
const GitRepoList: React.FC = () => {
    const access = useAccess();

    // 统计
    const [stats, setStats] = useState({ total: 0, ready: 0, pending: 0, error: 0 });
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [syncing, setSyncing] = useState<string>();

    // 详情 Drawer
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [currentRow, setCurrentRow] = useState<AutoHealing.GitRepository>();
    const [activeTab, setActiveTab] = useState('info');
    const [commits, setCommits] = useState<any[]>([]);
    const [loadingCommits, setLoadingCommits] = useState(false);
    const [syncLogs, setSyncLogs] = useState<any[]>([]);
    const [loadingLogs, setLoadingLogs] = useState(false);

    // 文件浏览
    const [fileBrowserOpen, setFileBrowserOpen] = useState(false);
    const [fileTree, setFileTree] = useState<DataNode[]>([]);
    const [fileContent, setFileContent] = useState('');
    const [selectedFilePath, setSelectedFilePath] = useState('');
    const [loadingFiles, setLoadingFiles] = useState(false);
    const [loadingContent, setLoadingContent] = useState(false);
    const [drawerPlaybooks, setDrawerPlaybooks] = useState<AutoHealing.Playbook[]>([]);



    const triggerRefresh = useCallback(() => setRefreshTrigger(n => n + 1), []);

    // ======= 操作 =======
    const handleSync = useCallback(async (repo: AutoHealing.GitRepository) => {
        setSyncing(repo.id);
        try {
            await syncGitRepo(repo.id);
            message.success('同步已触发');
            triggerRefresh();
        } catch { }
        finally { setSyncing(undefined); }
    }, [triggerRefresh]);

    const openDetail = useCallback(async (record: AutoHealing.GitRepository) => {
        setCurrentRow(record);
        setDrawerOpen(true);
        setActiveTab('info');
        setCommits([]);
        setSyncLogs([]);
        setDrawerPlaybooks([]);

        try {
            const res = await getGitRepo(record.id);
            setCurrentRow(res.data);

            // 按 repository_id 加载关联 Playbook
            getPlaybooks({ repository_id: record.id, page_size: 50 })
                .then(pbRes => setDrawerPlaybooks(pbRes.data || []))
                .catch(() => { });

            if (res.data.status === 'ready') {
                setLoadingCommits(true);
                try {
                    const cRes = await getCommits(res.data.id, 5);
                    setCommits(cRes.data || []);
                } catch { }
                finally { setLoadingCommits(false); }
            }

            setLoadingLogs(true);
            try {
                const lRes = await getSyncLogs(res.data.id, { page: 1, page_size: 10 });
                setSyncLogs(lRes.data || lRes.items || []);
            } catch { }
            finally { setLoadingLogs(false); }
        } catch { }
    }, []);

    const openCreate = useCallback(() => history.push('/execution/git-repos/create'), []);
    const openEdit = useCallback((r: AutoHealing.GitRepository) => history.push(`/execution/git-repos/${r.id}/edit`), []);

    const handleDelete = useCallback(async (id: string) => {
        try {
            await deleteGitRepo(id);
            message.success('删除成功');
            setDrawerOpen(false);
            triggerRefresh();
        } catch (err: any) {
            // 后端已有关联 Playbook 保护，直接展示错误
            const msg = err?.response?.data?.message || err?.data?.message || err?.message || '删除失败';
            message.error(msg);
        }
    }, [triggerRefresh]);

    // 文件浏览
    const loadFileTree = useCallback(async (id: string) => {
        setLoadingFiles(true);
        setFileTree([]);
        setFileContent('');
        try {
            const res = await getFiles(id);
            const convert = (items: any[]): DataNode[] => items.map(i => ({
                key: i.path,
                title: <Space size={4}>{i.type === 'directory' ? <FolderOutlined style={{ color: '#faad14' }} /> : <FileOutlined style={{ color: '#1890ff' }} />}{i.name}</Space>,
                isLeaf: i.type === 'file',
                children: i.children ? convert(i.children) : undefined,
            }));
            setFileTree(convert(res.data.files || []));
        } catch { }
        finally { setLoadingFiles(false); }
    }, []);

    const loadFileContent = useCallback(async (id: string, path: string) => {
        setLoadingContent(true);
        setSelectedFilePath(path);
        try {
            const res = await getFiles(id, path);
            setFileContent(res.data.content || '');
        } catch { }
        finally { setLoadingContent(false); }
    }, []);

    // ======= 列 =======
    const columns = useMemo<StandardColumnDef<AutoHealing.GitRepository>[]>(() => [
        {
            columnKey: 'name', columnTitle: '仓库', fixedColumn: true, dataIndex: 'name', width: 360, sorter: true,
            render: (_: any, r: AutoHealing.GitRepository) => {
                const st = statusConfig[r.status] || statusConfig.pending;
                return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {(() => {
                            const p = getProviderInfo(r.url); return (
                                <Tooltip title={p.label}>
                                    <div className="git-repo-icon" style={{ background: p.bg, color: p.color }}>
                                        <span style={{ fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{p.icon}</span>
                                    </div>
                                </Tooltip>
                            );
                        })()}
                        <div style={{ minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                                <a style={{ fontWeight: 500, color: '#1677ff', cursor: 'pointer' }}
                                    onClick={(e) => { e.stopPropagation(); openDetail(r); }}>{r.name}</a>
                                <Tag color={st.color} style={{ marginLeft: 6, fontSize: 11 }}>{st.text}</Tag>
                                {r.sync_enabled && <Tooltip title="已启用定时同步"><CloudSyncOutlined style={{ color: '#1890ff', marginLeft: 4 }} /></Tooltip>}
                                {((r as any).playbook_count || 0) > 0 && (
                                    <Tooltip title={`关联 ${(r as any).playbook_count} 个 Playbook`}>
                                        <span className="git-playbook-badge"><FileTextOutlined />{(r as any).playbook_count}</span>
                                    </Tooltip>
                                )}
                            </div>
                            <div style={{ fontSize: 11, color: '#8c8c8c', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                <BranchesOutlined style={{ marginRight: 2 }} />{r.default_branch || 'main'} · {r.url}
                            </div>
                        </div>
                    </div>
                );
            },
        },
        {
            columnKey: 'status', columnTitle: '状态', dataIndex: 'status', width: 90, sorter: true,
            headerFilters: REPO_STATUS_OPTIONS,
            render: (_: any, r: AutoHealing.GitRepository) => {
                const st = statusConfig[r.status] || statusConfig.pending;
                return <Badge status={st.badge} text={st.text} />;
            },
        },
        {
            columnKey: 'auth_type', columnTitle: '认证', dataIndex: 'auth_type', width: 80,
            headerFilters: AUTH_TYPE_OPTIONS,
            render: (v: string) => {
                const auth = authLabels[v] || authLabels.none;
                return <Space size={4}><Text type="secondary">{auth.icon}</Text><Text type="secondary">{auth.text}</Text></Space>;
            },
        },
        {
            columnKey: 'last_commit_id', columnTitle: 'Commit', dataIndex: 'last_commit_id', width: 120,
            render: (v: string) => v ? <Text code copyable={{ text: v }} style={{ fontSize: 11 }}>{v}</Text> : '-',
        },
        {
            columnKey: 'sync_info', columnTitle: '同步', width: 150,
            render: (_: any, r: AutoHealing.GitRepository) => (
                <div>
                    {r.sync_enabled ? <Tag color="blue" icon={<SyncOutlined />}>{r.sync_interval}</Tag> : <Tag>未开启</Tag>}
                    {r.last_sync_at && (
                        <Tooltip title={dayjs(r.last_sync_at).format('YYYY-MM-DD HH:mm:ss')}>
                            <div style={{ fontSize: 11, color: '#8c8c8c', marginTop: 2, cursor: 'default' }}>{dayjs(r.last_sync_at).fromNow()}</div>
                        </Tooltip>
                    )}
                </div>
            ),
        },
        {
            columnKey: 'created_at', columnTitle: '创建时间', dataIndex: 'created_at', width: 140, defaultVisible: false, sorter: true,
            render: (_: any, r: AutoHealing.GitRepository) => dayjs(r.created_at).format('YYYY-MM-DD HH:mm'),
        },
        {
            columnKey: 'actions', columnTitle: '操作', fixedColumn: true, width: 160,
            render: (_: any, r: AutoHealing.GitRepository) => (
                <Space size="small" onClick={(e) => e.stopPropagation()}>
                    <Tooltip title="手动同步">
                        <Button type="link" size="small"
                            icon={syncing === r.id ? <Spin size="small" /> : <SyncOutlined />}
                            onClick={() => handleSync(r)} disabled={!!syncing || !access.canManageGitRepo} />
                    </Tooltip>
                    <Tooltip title="文件浏览">
                        <Button type="link" size="small" icon={<FolderOutlined />}
                            onClick={() => { setCurrentRow(r); loadFileTree(r.id); setFileBrowserOpen(true); }}
                            disabled={r.status !== 'ready'} />
                    </Tooltip>
                    <Tooltip title="编辑">
                        <Button type="link" size="small" icon={<SettingOutlined />}
                            onClick={() => openEdit(r)} disabled={!access.canManageGitRepo} />
                    </Tooltip>
                    <Popconfirm title="确定删除？" description="本地代码也会被清除，不可恢复" onConfirm={() => handleDelete(r.id)}>
                        <Button type="link" size="small" danger icon={<DeleteOutlined />} disabled={!access.canDeleteRepo} />
                    </Popconfirm>
                </Space>
            ),
        },
    ], [openDetail, openEdit, handleSync, handleDelete, syncing, access, loadFileTree]);

    // ======= 数据请求 =======
    const handleRequest = useCallback(async (params: {
        page: number; pageSize: number; searchField?: string; searchValue?: string;
        advancedSearch?: Record<string, any>; sorter?: { field: string; order: 'ascend' | 'descend' };
    }) => {
        try {
            const apiParams: Record<string, any> = {
                page: params.page,
                page_size: params.pageSize,
            };

            // 简单搜索
            if (params.searchValue) {
                if (params.searchField) {
                    apiParams[params.searchField] = params.searchValue;
                } else {
                    apiParams.search = params.searchValue;
                }
            }

            // 高级搜索
            if (params.advancedSearch) {
                const adv = params.advancedSearch;
                if (adv.name) apiParams.name = adv.name;
                if (adv.url) apiParams.url = adv.url;
                if (adv.status) apiParams.status = adv.status;
                if (adv.auth_type) apiParams.auth_type = adv.auth_type;
                if (adv.sync_enabled) apiParams.sync_enabled = adv.sync_enabled;
                if (adv.created_at && adv.created_at[0] && adv.created_at[1]) {
                    apiParams.created_from = adv.created_at[0].toISOString();
                    apiParams.created_to = adv.created_at[1].toISOString();
                }
            }

            // 排序
            if (params.sorter) {
                apiParams.sort_field = params.sorter.field;
                apiParams.sort_order = params.sorter.order === 'ascend' ? 'asc' : 'desc';
            }

            const res = await getGitRepos(apiParams);
            const items = res.data || [];
            const total = (res as any)?.total ?? items.length;

            // 更新统计（使用后端 stats API）
            getGitRepoStats().then(statsRes => {
                if (statsRes?.data) {
                    const byStatus = statsRes.data.by_status || [];
                    const getCount = (s: string) => byStatus.find((x: any) => x.status === s)?.count || 0;
                    setStats({
                        total: statsRes.data.total || 0,
                        ready: getCount('ready'),
                        pending: getCount('pending'),
                        error: getCount('error'),
                    });
                }
            }).catch(() => { });

            return { data: items, total };
        } catch {
            return { data: [], total: 0 };
        }
    }, []);

    // ======= 统计栏 =======
    const statsBar = useMemo(() => (
        <div className="git-stats-bar">
            {[
                { icon: <CodeOutlined />, cls: 'total', val: stats.total, lbl: '总仓库' },
                { icon: <CheckCircleOutlined />, cls: 'ready', val: stats.ready, lbl: '就绪' },
                { icon: <ClockCircleOutlined />, cls: 'pending', val: stats.pending, lbl: '待同步' },
                { icon: <CloseCircleOutlined />, cls: 'error', val: stats.error, lbl: '错误' },
            ].map((s, i) => (
                <React.Fragment key={i}>
                    {i > 0 && <div className="git-stat-divider" />}
                    <div className="git-stat-item">
                        <span className={`git-stat-icon git-stat-icon-${s.cls}${syncing && s.cls === 'pending' ? ' git-stat-icon-syncing' : ''}`}>{s.icon}</span>
                        <div className="git-stat-content">
                            <div className="git-stat-value">{s.val}</div>
                            <div className="git-stat-label">{s.lbl}</div>
                        </div>
                    </div>
                </React.Fragment>
            ))}
        </div>
    ), [stats, syncing]);

    // extraActions 移至 primaryAction（右侧按钮）

    // ======= Drawer 详情 =======
    const renderDrawer = () => {
        if (!currentRow) return null;
        const st = statusConfig[currentRow.status] || statusConfig.pending;
        const auth = authLabels[currentRow.auth_type] || authLabels.none;

        return (
            <Drawer title={null} size={680} open={drawerOpen}
                onClose={() => { setDrawerOpen(false); setActiveTab('info'); }}
                styles={{ header: { display: 'none' }, body: { padding: 0 } }} destroyOnHidden>

                {/* Header */}
                <div className="git-detail-header">
                    <div className="git-detail-header-top">
                        {(() => {
                            const p = getProviderInfo(currentRow.url); return (
                                <div className="git-detail-header-icon" style={{ background: p.bg, color: p.color }}>{p.icon}</div>
                            );
                        })()}
                        <div className="git-detail-header-info">
                            <div className="git-detail-title">{currentRow.name}</div>
                            <div className="git-detail-sub">{currentRow.url}</div>
                        </div>
                        <Badge status={st.badge} text={st.text} />
                    </div>
                    <Space size="small">
                        <Button size="small" icon={<SyncOutlined spin={syncing === currentRow.id} />}
                            onClick={() => handleSync(currentRow)} disabled={!!syncing || !access.canManageGitRepo}>同步</Button>
                        <Button size="small" icon={<FolderOutlined />}
                            onClick={() => { loadFileTree(currentRow.id); setFileBrowserOpen(true); }}
                            disabled={currentRow.status !== 'ready'}>文件</Button>
                        <Button size="small" icon={<SettingOutlined />}
                            onClick={() => { setDrawerOpen(false); openEdit(currentRow); }} disabled={!access.canManageGitRepo}>编辑</Button>
                        <Popconfirm title="确定删除？" description="本地代码也会被清除" onConfirm={() => handleDelete(currentRow.id)}>
                            <Button size="small" danger icon={<DeleteOutlined />} disabled={!access.canDeleteRepo}>删除</Button>
                        </Popconfirm>
                    </Space>
                </div>

                <Tabs activeKey={activeTab} onChange={setActiveTab} className="git-detail-tabs"
                    items={[
                        {
                            key: 'info',
                            label: '概览',
                            children: (
                                <div className="git-detail-body">
                                    {/* 基本信息 */}
                                    <div className="git-detail-card">
                                        <div className="git-detail-card-header">
                                            <InfoCircleOutlined className="git-detail-card-header-icon" />
                                            <span className="git-detail-card-header-title">基本信息</span>
                                        </div>
                                        <div className="git-detail-card-body">
                                            <div className="git-detail-grid">
                                                <div className="git-detail-field" style={{ gridColumn: '1 / -1' }}>
                                                    <span className="git-detail-field-label">仓库地址</span>
                                                    <div className="git-detail-field-value">
                                                        <Text code copyable style={{ wordBreak: 'break-all', fontSize: 12 }}>{currentRow.url}</Text>
                                                    </div>
                                                </div>
                                                <div className="git-detail-field">
                                                    <span className="git-detail-field-label">默认分支</span>
                                                    <div className="git-detail-field-value">
                                                        <Tag icon={<BranchesOutlined />}>{currentRow.default_branch || 'main'}</Tag>
                                                    </div>
                                                </div>
                                                <div className="git-detail-field">
                                                    <span className="git-detail-field-label">认证方式</span>
                                                    <div className="git-detail-field-value">
                                                        <Space size={4}>{auth.icon}<span>{auth.text}</span></Space>
                                                    </div>
                                                </div>
                                                <div className="git-detail-field">
                                                    <span className="git-detail-field-label">当前 Commit</span>
                                                    <div className="git-detail-field-value">
                                                        {currentRow.last_commit_id
                                                            ? <Text code copyable={{ text: currentRow.last_commit_id }} style={{ fontSize: 11 }}>{currentRow.last_commit_id}</Text>
                                                            : '-'}
                                                    </div>
                                                </div>
                                                <div className="git-detail-field">
                                                    <span className="git-detail-field-label">本地路径</span>
                                                    <div className="git-detail-field-value">
                                                        <Text code style={{ fontSize: 11 }}>{currentRow.local_path || '-'}</Text>
                                                    </div>
                                                </div>
                                                <div className="git-detail-field">
                                                    <span className="git-detail-field-label">创建时间</span>
                                                    <div className="git-detail-field-value">{dayjs(currentRow.created_at).format('YYYY-MM-DD HH:mm')}</div>
                                                </div>
                                                <div className="git-detail-field">
                                                    <span className="git-detail-field-label">更新时间</span>
                                                    <div className="git-detail-field-value">{currentRow.updated_at ? dayjs(currentRow.updated_at).format('YYYY-MM-DD HH:mm') : '-'}</div>
                                                </div>
                                                {currentRow.error_message && (
                                                    <div className="git-detail-field" style={{ gridColumn: '1 / -1' }}>
                                                        <span className="git-detail-field-label">错误信息</span>
                                                        <div className="git-detail-field-value" style={{ color: '#ff4d4f' }}>{currentRow.error_message}</div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* 同步配置 */}
                                    <div className="git-detail-card">
                                        <div className="git-detail-card-header">
                                            <SyncOutlined className="git-detail-card-header-icon" />
                                            <span className="git-detail-card-header-title">同步配置</span>
                                        </div>
                                        <div className="git-detail-card-body">
                                            <div className="git-detail-grid">
                                                <div className="git-detail-field">
                                                    <span className="git-detail-field-label">定时同步</span>
                                                    <div className="git-detail-field-value">
                                                        {currentRow.sync_enabled
                                                            ? <Tag color="blue" icon={<SyncOutlined />}>每 {currentRow.sync_interval}</Tag>
                                                            : <Tag>未开启</Tag>}
                                                    </div>
                                                </div>
                                                <div className="git-detail-field">
                                                    <span className="git-detail-field-label">上次同步</span>
                                                    <div className="git-detail-field-value">{currentRow.last_sync_at ? dayjs(currentRow.last_sync_at).format('YYYY-MM-DD HH:mm') : '暂无'}</div>
                                                </div>
                                                {currentRow.next_sync_at && currentRow.sync_enabled && (
                                                    <div className="git-detail-field">
                                                        <span className="git-detail-field-label">下次同步</span>
                                                        <div className="git-detail-field-value" style={{ color: '#1890ff' }}>{dayjs(currentRow.next_sync_at).format('YYYY-MM-DD HH:mm')}</div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* 最近提交 — Git 时间线 */}
                                    <div className="git-detail-card">
                                        <div className="git-detail-card-header">
                                            <HistoryOutlined className="git-detail-card-header-icon" />
                                            <span className="git-detail-card-header-title">最近提交</span>
                                            {commits.length > 0 && <span className="git-detail-card-header-count">{commits.length} 条</span>}
                                        </div>
                                        <div className="git-detail-card-body">
                                            {loadingCommits ? <div style={{ textAlign: 'center', padding: 16 }}><Spin size="small" /></div>
                                                : commits.length > 0
                                                    ? <div className="git-timeline">
                                                        {commits.map((c, i) => (
                                                            <div key={i} className="git-timeline-item">
                                                                <div className="git-timeline-dot" />
                                                                <div>
                                                                    <span className="git-timeline-commit-hash">{c.commit_id}</span>
                                                                    <span className="git-timeline-message">{c.message}</span>
                                                                </div>
                                                                <div className="git-timeline-meta">{c.author} · {dayjs(c.date).fromNow()}</div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无提交记录" />}
                                        </div>
                                    </div>

                                    {/* 关联 Playbook */}
                                    {drawerPlaybooks.length > 0 && (
                                        <div className="git-detail-card">
                                            <div className="git-detail-card-header">
                                                <FileTextOutlined className="git-detail-card-header-icon" />
                                                <span className="git-detail-card-header-title">关联 Playbook</span>
                                                <span className="git-detail-card-header-count">{drawerPlaybooks.length} 个</span>
                                            </div>
                                            <div style={{ padding: 0 }}>
                                                {drawerPlaybooks.map(pb => (
                                                    <div key={pb.id} className="git-playbook-link"
                                                        onClick={() => history.push(`/execution/playbooks`)}>
                                                        <div className="git-playbook-link-icon"><FileTextOutlined /></div>
                                                        <div className="git-playbook-link-info">
                                                            <div className="git-playbook-link-name">{pb.name}</div>
                                                            {pb.file_path && <div className="git-playbook-link-path">{pb.file_path}</div>}
                                                        </div>
                                                        <RightOutlined style={{ color: '#d9d9d9', fontSize: 12 }} />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                </div>
                            ),
                        },
                        {
                            key: 'logs',
                            label: <><CloudSyncOutlined style={{ marginRight: 4 }} />同步日志</>,
                            children: (
                                <div className="git-detail-body">
                                    {loadingLogs ? <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div>
                                        : syncLogs.length > 0
                                            ? <Table size="small" pagination={false} dataSource={syncLogs} rowKey="id"
                                                expandable={{
                                                    expandedRowRender: (r: any) => (
                                                        <div style={{ padding: '4px 0', fontSize: 12, color: '#ff4d4f', wordBreak: 'break-all' }}>
                                                            <Text type="danger" style={{ fontSize: 12 }}>{r.error_message}</Text>
                                                        </div>
                                                    ),
                                                    rowExpandable: (r: any) => !!r.error_message,
                                                    defaultExpandedRowKeys: syncLogs.filter(l => l.status === 'failed' && l.error_message).slice(0, 3).map(l => l.id),
                                                    expandIcon: ({ expanded, onExpand, record }: any) =>
                                                        record.error_message
                                                            ? <span style={{ cursor: 'pointer', color: '#ff4d4f', fontSize: 12, display: 'inline-block', width: 16, textAlign: 'center' }}
                                                                onClick={e => onExpand(record, e)}>{expanded ? '−' : '+'}</span>
                                                            : <span style={{ display: 'inline-block', width: 16, textAlign: 'center', color: '#52c41a', fontSize: 14 }}>✓</span>,
                                                }}
                                                columns={[
                                                    {
                                                        title: '状态', dataIndex: 'status', width: 80,
                                                        render: (s: string) => (
                                                            <Badge status={s === 'success' ? 'success' : s === 'failed' ? 'error' : 'processing'}
                                                                text={s === 'success' ? '成功' : s === 'failed' ? '失败' : '进行中'} />
                                                        ),
                                                    },
                                                    {
                                                        title: '触发', dataIndex: 'trigger_type', width: 60,
                                                        render: (t: string) => <Tag>{t === 'manual' ? '手动' : t === 'create' ? '创建' : t === 'scheduled' ? '定时' : t}</Tag>,
                                                    },
                                                    {
                                                        title: '操作', dataIndex: 'action', width: 60,
                                                        render: (a: string) => a === 'pull' ? '拉取' : a === 'clone' ? '克隆' : a || '-',
                                                    },
                                                    {
                                                        title: 'Commit', dataIndex: 'commit_id', width: 100,
                                                        render: (v: string) => v ? <Text code style={{ fontSize: 11 }}>{v}</Text> : '-',
                                                    },
                                                    {
                                                        title: '时间', dataIndex: 'created_at', width: 120,
                                                        render: (t: string) => <span style={{ fontSize: 12 }}>{dayjs(t).format('MM-DD HH:mm:ss')}</span>,
                                                    },
                                                ]} />
                                            : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无同步记录" />}
                                </div>
                            ),
                        },
                    ]}
                />
            </Drawer>
        );
    };

    // ======= 文件浏览器 =======
    const renderFileBrowser = () => {
        if (!currentRow) return null;
        return (
            <Modal title={<Space><FolderOutlined />{currentRow.name} - 文件浏览</Space>} open={fileBrowserOpen}
                onCancel={() => setFileBrowserOpen(false)} footer={null} width={1000} styles={{ body: { padding: 0 } }}
                getContainer={false} zIndex={1100}>
                <div style={{ display: 'flex', height: 500 }}>
                    <div style={{ width: 260, borderRight: '1px solid #f0f0f0', overflow: 'auto', padding: 8 }}>
                        <Button size="small" icon={<ReloadOutlined spin={loadingFiles} />}
                            onClick={() => loadFileTree(currentRow.id)} loading={loadingFiles} style={{ marginBottom: 8 }}>刷新</Button>
                        {loadingFiles ? <Spin /> : fileTree.length > 0
                            ? <Tree showLine treeData={fileTree}
                                onSelect={(_, i) => { const n = i.node as DataNode; if (n.isLeaf) loadFileContent(currentRow.id, n.key as string); }} />
                            : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无" />}
                    </div>
                    <div style={{ flex: 1, overflow: 'auto', background: '#1e1e1e' }}>
                        {loadingContent ? <div style={{ padding: 80, textAlign: 'center' }}><Spin /></div>
                            : fileContent ? (
                                <>
                                    <div style={{ padding: '6px 12px', background: '#252526', borderBottom: '1px solid #3c3c3c' }}>
                                        <Text style={{ color: '#aaa', fontSize: 11 }}>{selectedFilePath}</Text>
                                    </div>
                                    <pre style={{ color: '#d4d4d4', padding: 12, margin: 0, fontSize: 12, fontFamily: 'Consolas, monospace', lineHeight: 1.4, whiteSpace: 'pre-wrap' }}>{fileContent}</pre>
                                </>
                            ) : <div style={{ padding: 80, textAlign: 'center' }}><FileOutlined style={{ fontSize: 32, color: '#555' }} /><div><Text style={{ color: '#888' }}>选择文件</Text></div></div>}
                    </div>
                </div>
            </Modal>
        );
    };

    // ======= 主渲染 =======
    return (
        <>
            <StandardTable<AutoHealing.GitRepository>
                refreshTrigger={refreshTrigger}
                tabs={[{ key: 'list', label: '仓库列表' }]}
                title="代码仓库"
                description="管理 Git 代码仓库，同步 Ansible Playbook 和配置文件。"
                headerIcon={headerIcon}
                headerExtra={statsBar}
                searchFields={searchFields}
                advancedSearchFields={advancedSearchFields}
                primaryActionLabel="添加仓库"
                primaryActionIcon={<PlusOutlined />}
                primaryActionDisabled={!access.canManageGitRepo}
                onPrimaryAction={openCreate}
                columns={columns}
                rowKey="id"
                onRowClick={openDetail}
                request={handleRequest}
                defaultPageSize={20}
                preferenceKey="git_repos_v2"
            />

            {renderDrawer()}
            {renderFileBrowser()}
        </>
    );
};

export default GitRepoList;
