import {
    CodeOutlined, FileTextOutlined, FolderOutlined, BranchesOutlined,
    PlusSquareOutlined, MinusSquareOutlined, CloudDownloadOutlined,
    CheckCircleOutlined, ClockCircleOutlined, SyncOutlined, CloseCircleOutlined,
    SearchOutlined, GlobalOutlined, RightOutlined, DatabaseOutlined, AppstoreOutlined,
    GithubOutlined, GitlabOutlined,
} from '@ant-design/icons';
import {
    Button, message, Space, Tag, Row, Col, Typography, Input, Spin,
    Select, Tree, Tooltip, Empty, Divider, Badge,
} from 'antd';
import type { DataNode } from 'antd/es/tree';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { history } from '@umijs/max';
import SubPageHeader from '@/components/SubPageHeader';
import { getGitRepos, getFiles } from '@/services/auto-healing/git-repos';
import { createPlaybook } from '@/services/auto-healing/playbooks';
import './index.css';
import '@/pages/plugins/PluginForm.css';

const { Text, Title } = Typography;

// Git 平台图标
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

const getProviderInfo = (url: string) => {
    const lower = (url || '').toLowerCase();
    if (lower.includes('github.com') || lower.includes('github.'))
        return { icon: <GithubOutlined />, color: '#24292f', label: 'GitHub' };
    if (lower.includes('gitlab.com') || lower.includes('gitlab.') || lower.includes('gitlab/'))
        return { icon: <GitlabOutlined />, color: '#e24329', label: 'GitLab' };
    if (lower.includes('bitbucket.org') || lower.includes('bitbucket.'))
        return { icon: <BitbucketIcon />, color: '#0052cc', label: 'Bitbucket' };
    if (lower.includes('gitee.com') || lower.includes('gitee.'))
        return { icon: <GiteeIcon />, color: '#c71d23', label: 'Gitee' };
    if (lower.includes('dev.azure.com') || lower.includes('visualstudio.com'))
        return { icon: <AzureIcon />, color: '#0078d4', label: 'Azure' };
    if (lower.startsWith('file://') || lower.startsWith('/'))
        return { icon: <FolderOutlined />, color: '#595959', label: '本地' };
    return { icon: <BranchesOutlined />, color: '#595959', label: 'Git' };
};

const PlaybookImport: React.FC = () => {
    const [repos, setRepos] = useState<AutoHealing.GitRepository[]>([]);
    const [loadingRepos, setLoadingRepos] = useState(true);
    const [selectedRepoId, setSelectedRepoId] = useState<string>();

    // 文件选择
    const [fileTree, setFileTree] = useState<DataNode[]>([]);
    const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
    const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
    const [loadingFiles, setLoadingFiles] = useState(false);

    // Playbook 配置
    const [playbooks, setPlaybooks] = useState<{ file: string; name: string; config_mode: 'auto' | 'enhanced' }[]>([]);
    const [creating, setCreating] = useState(false);

    // 加载仓库列表
    useEffect(() => {
        (async () => {
            setLoadingRepos(true);
            try {
                const res = await getGitRepos();
                setRepos(res.data || []);
            } catch { /* silent */ }
            finally { setLoadingRepos(false); }
        })();
    }, []);

    const repoMap = useMemo(() => new Map(repos.map(r => [r.id, r])), [repos]);
    const selectedRepo = selectedRepoId ? repoMap.get(selectedRepoId) : undefined;

    const statusConfig: Record<string, { color: string; text: string; icon: React.ReactNode }> = {
        ready: { color: '#52c41a', text: '就绪', icon: <CheckCircleOutlined style={{ color: '#52c41a' }} /> },
        syncing: { color: '#1890ff', text: '同步中', icon: <SyncOutlined spin style={{ color: '#1890ff' }} /> },
        pending: { color: '#faad14', text: '待同步', icon: <ClockCircleOutlined style={{ color: '#faad14' }} /> },
        error: { color: '#ff4d4f', text: '异常', icon: <CloseCircleOutlined style={{ color: '#ff4d4f' }} /> },
    };

    // 选择仓库 → 加载文件树
    const handleSelectRepo = useCallback(async (repoId: string) => {
        setSelectedRepoId(repoId);
        setSelectedFiles([]);
        setPlaybooks([]);
        setLoadingFiles(true);
        try {
            const res = await getFiles(repoId);
            const buildTree = (nodes: any[]): DataNode[] => {
                const sorted = [...nodes].sort((a, b) => {
                    const aIsDir = a.type === 'directory';
                    const bIsDir = b.type === 'directory';
                    if (aIsDir !== bIsDir) return aIsDir ? -1 : 1;
                    return a.name.localeCompare(b.name);
                });
                return sorted.map(node => {
                    const isDir = node.type === 'directory';
                    const isValidFile = /\.ya?ml$/i.test(node.name);
                    return {
                        key: node.path,
                        title: <span style={{ fontSize: 13 }}>{node.name}</span>,
                        icon: isDir
                            ? <FolderOutlined style={{ color: '#faad14' }} />
                            : isValidFile
                                ? <FileTextOutlined style={{ color: '#1890ff' }} />
                                : <FileTextOutlined style={{ color: '#d9d9d9' }} />,
                        isLeaf: !isDir,
                        children: node.children ? buildTree(node.children) : undefined,
                        checkable: !isDir && isValidFile,
                        selectable: false,
                        disabled: !isDir && !isValidFile,
                    };
                });
            };
            const fileData = Array.isArray(res.data) ? res.data : (res.data?.files || []);
            const tree = buildTree(fileData);
            setFileTree(tree);
            // 默认展开全部目录
            const collectDirKeys = (nodes: DataNode[]): string[] =>
                nodes.flatMap(n => n.children?.length ? [n.key as string, ...collectDirKeys(n.children)] : []);
            setExpandedKeys(collectDirKeys(tree));
        } catch { /* 全局错误处理 */ }
        finally { setLoadingFiles(false); }
    }, []);

    // 选中文件变化时，同步更新 playbooks 配置
    const handleCheckFiles = useCallback((keys: string[]) => {
        setSelectedFiles(keys);
        // 自动为新文件生成配置，保留已有配置
        setPlaybooks(prev => {
            const existing = new Map(prev.map(p => [p.file, p]));
            return keys.map(file => existing.get(file) || {
                file,
                name: file.replace(/\.ya?ml$/i, '').replace(/\//g, '-'),
                config_mode: 'auto' as const,
            });
        });
    }, []);

    // 创建 Playbook
    const handleCreate = useCallback(async () => {
        if (!selectedRepoId || playbooks.length === 0) return;
        setCreating(true);
        try {
            for (const pb of playbooks) {
                await createPlaybook({
                    repository_id: selectedRepoId,
                    name: pb.name,
                    file_path: pb.file,
                    config_mode: pb.config_mode,
                });
            }
            message.success(`成功导入 ${playbooks.length} 个 Playbook`);
            history.push('/execution/playbooks');
        } catch { /* ignore */ }
        finally { setCreating(false); }
    }, [selectedRepoId, playbooks]);

    return (
        <div className="plugin-form-page">
            <SubPageHeader
                title="导入 Playbook"
                onBack={() => history.push('/execution/playbooks')}
            />

            <div className="plugin-form-card">
                <div className="plugin-form-content" style={{ maxWidth: 900 }}>

                    {/* ========== 第一段：选择仓库 ========== */}
                    <Title level={5} style={{ marginBottom: 16, color: '#595959' }}>
                        <DatabaseOutlined style={{ marginRight: 8 }} />选择 Git 仓库
                    </Title>

                    {loadingRepos ? (
                        <div style={{ padding: '40px 0', textAlign: 'center' }}>
                            <Spin tip="加载仓库列表..."><div /></Spin>
                        </div>
                    ) : repos.length === 0 ? (
                        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无 Git 仓库">
                            <Button type="primary" onClick={() => history.push('/execution/git-repos/create')}>
                                前往添加仓库
                            </Button>
                        </Empty>
                    ) : (
                        <Row gutter={16}>
                            <Col span={10}>
                                <Select
                                    placeholder="选择 Git 仓库..."
                                    value={selectedRepoId}
                                    onChange={handleSelectRepo}
                                    style={{ width: '100%' }}
                                    showSearch
                                    optionFilterProp="label"
                                    options={repos.map(r => ({
                                        value: r.id,
                                        label: r.name,
                                    }))}
                                    optionRender={(option) => {
                                        const r = repoMap.get(option.value as string);
                                        if (!r) return option.label;
                                        const st = statusConfig[r.status] || statusConfig.pending;
                                        const provider = getProviderInfo(r.url);
                                        return (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 0' }}>
                                                <span style={{ fontSize: 18, color: provider.color, flexShrink: 0, display: 'flex', alignItems: 'center' }}>{provider.icon}</span>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
                                                        {r.name}
                                                        <span style={{
                                                            display: 'inline-block',
                                                            width: 6, height: 6, borderRadius: '50%',
                                                            backgroundColor: st.color, flexShrink: 0,
                                                        }} />
                                                        <span style={{ fontSize: 11, color: st.color, fontWeight: 400 }}>{st.text}</span>
                                                    </div>
                                                    <div style={{ fontSize: 11, color: '#8c8c8c', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {r.url}
                                                    </div>
                                                </div>
                                                <Tag style={{ margin: 0, fontSize: 11 }}>{r.default_branch}</Tag>
                                            </div>
                                        );
                                    }}
                                />
                            </Col>
                            <Col>
                                {selectedRepo && (
                                    <Space size={12}>
                                        <Text type="secondary" style={{ fontSize: 12 }}>
                                            <GlobalOutlined style={{ marginRight: 4 }} />
                                            {selectedRepo.url}
                                        </Text>
                                        <Tag icon={<BranchesOutlined />}>{selectedRepo.default_branch}</Tag>
                                    </Space>
                                )}
                            </Col>
                        </Row>
                    )}

                    {/* ========== 第二段：选择文件 ========== */}
                    {selectedRepoId && (
                        <>
                            <Divider dashed />
                            <Title level={5} style={{ marginBottom: 16, color: '#595959' }}>
                                <FileTextOutlined style={{ marginRight: 8 }} />选择入口文件
                                {selectedFiles.length > 0 && (
                                    <Badge count={selectedFiles.length} style={{ marginLeft: 8, backgroundColor: '#1890ff' }} />
                                )}
                            </Title>

                            {loadingFiles ? (
                                <div style={{ padding: '40px 0', textAlign: 'center' }}>
                                    <Spin tip="加载仓库文件..."><div /></Spin>
                                </div>
                            ) : (
                                <>
                                    <div className="playbook-import-tree-toolbar">
                                        <Space size={16}>
                                            <Text type="secondary" style={{ fontSize: 12 }}>
                                                <FolderOutlined style={{ color: '#faad14', marginRight: 4 }} />目录
                                            </Text>
                                            <Text type="secondary" style={{ fontSize: 12 }}>
                                                <FileTextOutlined style={{ color: '#1890ff', marginRight: 4 }} />可选文件
                                            </Text>
                                            <Text type="secondary" style={{ fontSize: 12 }}>
                                                <FileTextOutlined style={{ color: '#d9d9d9', marginRight: 4 }} />不可选
                                            </Text>
                                        </Space>
                                        <Space size={8}>
                                            <Button
                                                size="small"
                                                icon={<PlusSquareOutlined />}
                                                onClick={() => {
                                                    const collectDirKeys = (nodes: DataNode[]): string[] =>
                                                        nodes.flatMap(n => n.children?.length ? [n.key as string, ...collectDirKeys(n.children)] : []);
                                                    setExpandedKeys(collectDirKeys(fileTree));
                                                }}
                                            >
                                                展开全部
                                            </Button>
                                            <Button
                                                size="small"
                                                icon={<MinusSquareOutlined />}
                                                onClick={() => setExpandedKeys([])}
                                            >
                                                收起全部
                                            </Button>
                                        </Space>
                                    </div>

                                    <div className="playbook-import-tree-container">
                                        <Tree
                                            checkable
                                            showIcon
                                            showLine={{ showLeafIcon: false }}
                                            treeData={fileTree}
                                            expandedKeys={expandedKeys}
                                            onExpand={(keys) => setExpandedKeys(keys as string[])}
                                            checkedKeys={selectedFiles}
                                            onCheck={(keys) => handleCheckFiles(keys as string[])}
                                            style={{ padding: 12 }}
                                        />
                                    </div>
                                </>
                            )}
                        </>
                    )}

                    {/* ========== 第三段：配置 Playbook ========== */}
                    {playbooks.length > 0 && (
                        <>
                            <Divider dashed />
                            <Title level={5} style={{ marginBottom: 4, color: '#595959' }}>
                                <AppstoreOutlined style={{ marginRight: 8 }} />Playbook 配置
                            </Title>
                            <Text type="secondary" style={{ fontSize: 13, display: 'block', marginBottom: 16 }}>
                                为每个 Playbook 设置名称和扫描模式。
                                <Tooltip title="自动模式：基础变量扫描 | 增强模式：深度扫描（包括注释中的变量）">
                                    <Text type="secondary" style={{ fontSize: 12, marginLeft: 4, cursor: 'help', textDecoration: 'underline dotted' }}>
                                        扫描模式说明
                                    </Text>
                                </Tooltip>
                            </Text>

                            <div className="playbook-import-config-list">
                                {playbooks.map((pb, idx) => (
                                    <div key={pb.file} className="playbook-import-config-item">
                                        <div className="playbook-import-config-file">
                                            <FileTextOutlined style={{ color: '#1890ff', marginRight: 6 }} />
                                            <code>{pb.file}</code>
                                        </div>
                                        <Row gutter={12} style={{ marginTop: 8 }}>
                                            <Col flex="1">
                                                <Input
                                                    placeholder="Playbook 名称"
                                                    value={pb.name}
                                                    prefix={<CodeOutlined style={{ color: '#bfbfbf' }} />}
                                                    onChange={e => {
                                                        const newList = [...playbooks];
                                                        newList[idx] = { ...newList[idx], name: e.target.value };
                                                        setPlaybooks(newList);
                                                    }}
                                                />
                                            </Col>
                                            <Col>
                                                <Select
                                                    value={pb.config_mode}
                                                    onChange={val => {
                                                        const newList = [...playbooks];
                                                        newList[idx] = { ...newList[idx], config_mode: val };
                                                        setPlaybooks(newList);
                                                    }}
                                                    style={{ width: 100 }}
                                                    options={[
                                                        { value: 'auto', label: '自动' },
                                                        { value: 'enhanced', label: '增强' },
                                                    ]}
                                                />
                                            </Col>
                                        </Row>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}

                    {/* ========== 底部操作 ========== */}
                    {selectedRepoId && (
                        <>
                            <Divider dashed />
                            <div className="plugin-form-actions">
                                <Button onClick={() => history.push('/execution/playbooks')}>
                                    取消
                                </Button>
                                <Button
                                    type="primary"
                                    onClick={handleCreate}
                                    loading={creating}
                                    disabled={playbooks.length === 0 || playbooks.some(p => !p.name)}
                                    icon={<CloudDownloadOutlined />}
                                >
                                    导入 {playbooks.length} 个 Playbook
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PlaybookImport;
