import {
    PlusOutlined, SyncOutlined, BranchesOutlined, GithubOutlined, EyeOutlined, DeleteOutlined,
    CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined, KeyOutlined, LockOutlined,
    SafetyCertificateOutlined, GlobalOutlined, FolderOutlined, FileOutlined, ReloadOutlined,
    ExclamationCircleOutlined, SearchOutlined, CloudSyncOutlined, ArrowRightOutlined,
    CheckOutlined, LoadingOutlined, LinkOutlined, HistoryOutlined, CodeOutlined, SettingOutlined,
} from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { useAccess } from '@umijs/max';
import {
    Button, message, Space, Tag, Tooltip, Drawer, Descriptions, Card, Row, Col,
    Typography, Tabs, Empty, Alert, Modal, Input, Table, Spin, Badge, Steps, Form,
    Select, Radio, Result, Timeline, Avatar,
} from 'antd';
import type { DataNode } from 'antd/es/tree';
import { Tree } from 'antd';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    getGitRepos, getGitRepo, createGitRepo, updateGitRepo, deleteGitRepo,
    syncGitRepo, getFiles, validateGitRepo, getCommits, getSyncLogs,
} from '@/services/auto-healing/git-repos';
import { getPlaybooks } from '@/services/auto-healing/playbooks';

const { Text, Paragraph, Title } = Typography;

// ==================== 配置 ====================
const statusConfig: Record<string, { text: string; color: string; icon: React.ReactNode }> = {
    pending: { text: '待同步', color: 'default', icon: <ClockCircleOutlined /> },
    ready: { text: '就绪', color: 'success', icon: <CheckCircleOutlined /> },
    syncing: { text: '同步中', color: 'processing', icon: <SyncOutlined spin /> },
    error: { text: '错误', color: 'error', icon: <CloseCircleOutlined /> },
};

const authTypeOptions = [
    { value: 'none', label: '公开仓库', icon: <GlobalOutlined />, desc: '无需认证' },
    { value: 'token', label: 'Token', icon: <KeyOutlined />, desc: '访问令牌' },
    { value: 'password', label: '密码', icon: <LockOutlined />, desc: '用户名/密码' },
    { value: 'ssh_key', label: 'SSH', icon: <SafetyCertificateOutlined />, desc: 'SSH 密钥' },
];

// ==================== 主组件 ====================
const GitRepoList: React.FC = () => {
    const access = useAccess();
    const [repos, setRepos] = useState<AutoHealing.GitRepository[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState('');
    const [syncing, setSyncing] = useState<string>();

    // 创建向导
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [createStep, setCreateStep] = useState(0);
    const [createForm] = Form.useForm();
    const [validating, setValidating] = useState(false);
    const [availableBranches, setAvailableBranches] = useState<string[]>([]);
    const [defaultBranch, setDefaultBranch] = useState('');
    const [creating, setCreating] = useState(false);
    const [validatedData, setValidatedData] = useState<any>(null); // 保存验证后的数据

    // 详情
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [currentRow, setCurrentRow] = useState<AutoHealing.GitRepository>();
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [commits, setCommits] = useState<any[]>([]);
    const [loadingCommits, setLoadingCommits] = useState(false);
    const [syncLogs, setSyncLogs] = useState<any[]>([]);
    const [loadingLogs, setLoadingLogs] = useState(false);
    const [activeTab, setActiveTab] = useState('info');
    const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
    const [scheduleForm] = Form.useForm();
    const [savingSchedule, setSavingSchedule] = useState(false);

    // 文件浏览
    const [fileBrowserOpen, setFileBrowserOpen] = useState(false);
    const [fileTree, setFileTree] = useState<DataNode[]>([]);
    const [fileContent, setFileContent] = useState('');
    const [selectedFilePath, setSelectedFilePath] = useState('');
    const [loadingFiles, setLoadingFiles] = useState(false);
    const [loadingContent, setLoadingContent] = useState(false);

    // Form watch 移到组件顶层
    const authType = Form.useWatch('auth_type', createForm);
    const createSyncEnabled = Form.useWatch('sync_enabled', createForm);
    const scheduleSyncEnabled = Form.useWatch('sync_enabled', scheduleForm);

    // 加载
    const loadRepos = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getGitRepos();
            setRepos(res.data || []);
        } catch { }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { loadRepos(); }, [loadRepos]);

    // Playbook 数据（用于删除保护检查）
    const [playbooks, setPlaybooks] = useState<AutoHealing.Playbook[]>([]);
    useEffect(() => {
        getPlaybooks({ page_size: 500 }).then(res => setPlaybooks(res.data || res.items || [])).catch(() => { });
    }, []);

    // 获取仓库关联的 Playbook
    const getRepoPlaybooks = useCallback((repoId: string) => {
        return playbooks.filter(p => p.repository_id === repoId);
    }, [playbooks]);

    const filteredRepos = useMemo(() => {
        if (!searchText) return repos;
        return repos.filter(r => r.name.toLowerCase().includes(searchText.toLowerCase()) || r.url.toLowerCase().includes(searchText.toLowerCase()));
    }, [repos, searchText]);

    const stats = useMemo(() => ({
        total: repos.length,
        ready: repos.filter(r => r.status === 'ready').length,
        pending: repos.filter(r => r.status === 'pending').length,
        error: repos.filter(r => r.status === 'error').length,
    }), [repos]);

    // ==================== 创建向导 ====================
    const resetCreate = () => {
        setCreateStep(0);
        setAvailableBranches([]);
        setDefaultBranch('');
        setValidatedData(null);
        createForm.resetFields();
    };

    const openCreate = () => { resetCreate(); setCreateModalOpen(true); };
    const closeCreate = () => { setCreateModalOpen(false); resetCreate(); };

    // 第一步：验证
    const handleValidate = async () => {
        try {
            await createForm.validateFields(['url', 'auth_type', 'token', 'username', 'password', 'private_key']);
        } catch { return; }

        const values = createForm.getFieldsValue();
        setValidating(true);

        try {
            const req: any = { url: values.url, auth_type: values.auth_type || 'none' };
            if (values.auth_type === 'token') req.auth_config = { token: values.token };
            else if (values.auth_type === 'password') req.auth_config = { username: values.username, password: values.password };
            else if (values.auth_type === 'ssh_key') req.auth_config = { private_key: values.private_key, passphrase: values.passphrase };

            const res = await validateGitRepo(req);
            const branches = res.data?.branches || [];
            const defBranch = res.data?.default_branch || 'main';

            if (branches.length === 0) {
                message.warning('未检测到分支');
                return;
            }

            setAvailableBranches(branches);
            setDefaultBranch(defBranch);
            // 保存验证数据供创建时使用
            setValidatedData({
                url: values.url,
                auth_type: values.auth_type || 'none',
                auth_config: req.auth_config,
            });
            createForm.setFieldValue('default_branch', defBranch);
            setCreateStep(1);
            message.success(`验证成功，获取 ${branches.length} 个分支`);
        } catch {
            // 错误消息由全局错误处理器显示
        } finally {
            setValidating(false);
        }
    };

    // 第二步：创建
    const handleCreate = async () => {
        if (!validatedData) {
            message.error('请先验证仓库');
            return;
        }

        try {
            await createForm.validateFields(['name', 'default_branch']);
        } catch { return; }

        const values = createForm.getFieldsValue();
        setCreating(true);

        try {
            // 组合间隔值
            let syncInterval = '1h';
            if (values.interval_value && values.interval_unit) {
                syncInterval = `${values.interval_value}${values.interval_unit}`;
            }

            const req: AutoHealing.CreateGitRepoRequest = {
                name: values.name,
                url: validatedData.url,
                default_branch: values.default_branch,
                auth_type: validatedData.auth_type,
                auth_config: validatedData.auth_config,
                sync_enabled: values.sync_enabled || false,
                sync_interval: syncInterval,
            };

            await createGitRepo(req);
            setCreateStep(2);
            loadRepos();
        } catch {
            // 错误消息由全局错误处理器显示
        } finally {
            setCreating(false);
        }
    };

    // ==================== 操作 ====================
    const handleSync = useCallback(async (repo: AutoHealing.GitRepository) => {
        setSyncing(repo.id);
        try {
            await syncGitRepo(repo.id);
            message.success('同步已触发');
            loadRepos();
            // 2秒后自动刷新同步日志
            setTimeout(async () => {
                try {
                    const logRes = await getSyncLogs(repo.id, { page: 1, page_size: 10 });
                    setSyncLogs(logRes.data || []);
                } catch { }
            }, 2000);
        } catch { }
        finally { setSyncing(undefined); }
    }, [loadRepos]);

    const handleViewDetail = useCallback(async (record: AutoHealing.GitRepository) => {
        setCurrentRow(record);
        setDrawerOpen(true);
        setCommits([]);
        setSyncLogs([]);

        try {
            const res = await getGitRepo(record.id);
            setCurrentRow(res.data);

            // 加载 commits
            if (res.data.status === 'ready') {
                setLoadingCommits(true);
                try {
                    const cRes = await getCommits(res.data.id, 5);
                    setCommits(cRes.data || []);
                } catch { }
                finally { setLoadingCommits(false); }
            }

            // 加载同步日志
            setLoadingLogs(true);
            try {
                const lRes = await getSyncLogs(res.data.id, { page: 1, page_size: 10 });
                setSyncLogs(lRes.data || lRes.items || []);
            } catch { }
            finally { setLoadingLogs(false); }
        } catch { }
    }, []);

    const handleDelete = useCallback(async () => {
        if (!currentRow) return;
        const relatedPlaybooks = getRepoPlaybooks(currentRow.id);
        if (relatedPlaybooks.length > 0) {
            message.error(`无法删除：该仓库关联 ${relatedPlaybooks.length} 个 Playbook，请先删除 Playbook`);
            return;
        }
        try {
            await deleteGitRepo(currentRow.id);
            message.success('删除成功');
            setDeleteConfirmOpen(false);
            setDrawerOpen(false);
            loadRepos();
        } catch { }
    }, [currentRow, loadRepos, getRepoPlaybooks]);

    // 文件浏览
    const loadFileTree = async (id: string) => {
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
    };

    const loadFileContent = async (id: string, path: string) => {
        setLoadingContent(true);
        setSelectedFilePath(path);
        try {
            const res = await getFiles(id, path);
            setFileContent(res.data.content || '');
        } catch { }
        finally { setLoadingContent(false); }
    };

    // ==================== 渲染创建向导 ====================
    const renderCreateWizard = () => {

        return (
            <Modal title={null} open={createModalOpen} onCancel={closeCreate} footer={null} width={640} destroyOnClose centered styles={{ body: { padding: 0 } }}>
                <div style={{ padding: '32px' }}>
                    {/* Header */}
                    <div style={{ textAlign: 'center', marginBottom: 24 }}>
                        <Avatar size={56} style={{ background: '#f0f0f0', marginBottom: 12 }}>
                            <GithubOutlined style={{ fontSize: 28, color: '#333' }} />
                        </Avatar>
                        <Title level={4} style={{ marginBottom: 4 }}>添加 Git 仓库</Title>
                        <Text type="secondary">连接代码仓库，导入 Ansible Playbook</Text>
                    </div>

                    <Steps current={createStep} size="small" style={{ marginBottom: 24 }} items={[{ title: '验证仓库' }, { title: '完善信息' }, { title: '完成' }]} />

                    <Form form={createForm} layout="vertical" requiredMark={false} preserve>
                        {createStep === 0 && (
                            <>
                                <Form.Item name="url" label="仓库地址" rules={[{ required: true, message: '请输入' }]}>
                                    <Input size="large" placeholder="https://github.com/org/repo.git" prefix={<LinkOutlined style={{ color: '#bfbfbf' }} />} />
                                </Form.Item>

                                <Form.Item name="auth_type" label="认证方式" initialValue="none">
                                    <Radio.Group>
                                        <Space size="middle">
                                            {authTypeOptions.map(o => (
                                                <Radio key={o.value} value={o.value}>
                                                    <Space size={4}>
                                                        <span style={{ color: '#666' }}>{o.icon}</span>
                                                        <span>{o.label}</span>
                                                    </Space>
                                                </Radio>
                                            ))}
                                        </Space>
                                    </Radio.Group>
                                </Form.Item>

                                {authType === 'token' && <Form.Item name="token" label="Access Token" rules={[{ required: true }]}><Input.Password placeholder="ghp_xxxx" /></Form.Item>}
                                {authType === 'password' && (
                                    <Row gutter={12}>
                                        <Col span={12}><Form.Item name="username" label="用户名" rules={[{ required: true }]}><Input /></Form.Item></Col>
                                        <Col span={12}><Form.Item name="password" label="密码" rules={[{ required: true }]}><Input.Password /></Form.Item></Col>
                                    </Row>
                                )}
                                {authType === 'ssh_key' && (
                                    <>
                                        <Form.Item name="private_key" label="SSH 私钥" rules={[{ required: true }]}><Input.TextArea rows={3} placeholder="-----BEGIN RSA PRIVATE KEY-----" style={{ fontFamily: 'monospace', fontSize: 11 }} /></Form.Item>
                                        <Form.Item name="passphrase" label="密钥密码"><Input.Password placeholder="可选" /></Form.Item>
                                    </>
                                )}

                                <Button type="primary" block size="large" onClick={handleValidate} loading={validating}>
                                    {validating ? '验证中...' : '验证并获取分支'}
                                </Button>
                            </>
                        )}

                        {createStep === 1 && (
                            <>
                                <Alert type="success" message={`验证成功，检测到 ${availableBranches.length} 个分支`} showIcon style={{ marginBottom: 16 }} />

                                <Row gutter={12}>
                                    <Col span={12}>
                                        <Form.Item name="name" label="仓库名称" rules={[{ required: true }]}>
                                            <Input placeholder="ansible-playbooks" />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item name="default_branch" label="默认分支" rules={[{ required: true }]}>
                                            <Select>
                                                {availableBranches.map(b => <Select.Option key={b} value={b}>{b === defaultBranch ? `${b} (默认)` : b}</Select.Option>)}
                                            </Select>
                                        </Form.Item>
                                    </Col>
                                </Row>

                                <Form.Item name="sync_enabled" label="定时同步" initialValue={false}>
                                    <Radio.Group>
                                        <Radio value={false}>不启用</Radio>
                                        <Radio value={true}>启用</Radio>
                                    </Radio.Group>
                                </Form.Item>

                                {createSyncEnabled && (
                                    <Form.Item label="同步频率">
                                        <Space.Compact>
                                            <Form.Item name="interval_value" noStyle initialValue={1}>
                                                <Select style={{ width: 80 }}>
                                                    {[1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 24, 30].map(n => (
                                                        <Select.Option key={n} value={n}>{n}</Select.Option>
                                                    ))}
                                                </Select>
                                            </Form.Item>
                                            <Form.Item name="interval_unit" noStyle initialValue="h">
                                                <Select style={{ width: 80 }}>
                                                    <Select.Option value="m">分钟</Select.Option>
                                                    <Select.Option value="h">小时</Select.Option>
                                                    <Select.Option value="d">天</Select.Option>
                                                </Select>
                                            </Form.Item>
                                        </Space.Compact>
                                    </Form.Item>
                                )}

                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
                                    <Button onClick={() => setCreateStep(0)}>上一步</Button>
                                    <Button type="primary" onClick={handleCreate} loading={creating} icon={<CheckOutlined />} disabled={!access.canManageGitRepo}>创建仓库</Button>
                                </div>
                            </>
                        )}

                        {createStep === 2 && (
                            <Result status="success" title="创建成功" subTitle="仓库已添加，正在后台同步代码" extra={<Button type="primary" onClick={closeCreate}>完成</Button>} />
                        )}
                    </Form>
                </div>
            </Modal>
        );
    };

    // ==================== 渲染详情抽屉 ====================
    const renderDrawer = () => {
        if (!currentRow) return null;
        const st = statusConfig[currentRow.status] || statusConfig.pending;

        return (
            <Drawer
                title={<Space><GithubOutlined />{currentRow.name}</Space>}
                width={720}
                open={drawerOpen}
                onClose={() => { setDrawerOpen(false); setActiveTab('info'); }}
                extra={
                    <Space>
                        <Button icon={<SyncOutlined spin={syncing === currentRow.id} />} onClick={() => handleSync(currentRow)} disabled={syncing === currentRow.id}>手动同步</Button>
                        <Button icon={<SettingOutlined />} onClick={() => { scheduleForm.setFieldsValue({ sync_enabled: currentRow.sync_enabled, sync_interval: currentRow.sync_interval || '1h' }); setScheduleModalOpen(true); }}>调度</Button>
                        <Button icon={<FolderOutlined />} onClick={() => { loadFileTree(currentRow.id); setFileBrowserOpen(true); }} disabled={currentRow.status !== 'ready'}>文件</Button>
                        <Button danger icon={<DeleteOutlined />} onClick={() => setDeleteConfirmOpen(true)} disabled={!access.canManageGitRepo}>删除</Button>
                    </Space>
                }
            >
                <Tabs activeKey={activeTab} onChange={setActiveTab} items={[
                    {
                        key: 'info',
                        label: '概览',
                        children: (
                            <>
                                <Descriptions column={2} size="small" bordered style={{ marginBottom: 16 }}>
                                    <Descriptions.Item label="URL" span={2}><Text copyable style={{ wordBreak: 'break-all' }}>{currentRow.url}</Text></Descriptions.Item>
                                    <Descriptions.Item label="本地路径" span={2}><Text code style={{ fontSize: 12 }}>{currentRow.local_path || '-'}</Text></Descriptions.Item>
                                    <Descriptions.Item label="默认分支"><Tag icon={<BranchesOutlined />}>{currentRow.default_branch || 'main'}</Tag></Descriptions.Item>
                                    <Descriptions.Item label="当前 Commit">{currentRow.last_commit_id ? <Text code copyable style={{ fontSize: 12 }}>{currentRow.last_commit_id}</Text> : '-'}</Descriptions.Item>
                                    <Descriptions.Item label="状态"><Tag color={st.color} icon={st.icon}>{st.text}</Tag></Descriptions.Item>
                                    <Descriptions.Item label="最后同步">{currentRow.last_sync_at ? new Date(currentRow.last_sync_at).toLocaleString() : '-'}</Descriptions.Item>
                                    <Descriptions.Item label="定时同步">{currentRow.sync_enabled ? <Text style={{ color: '#1890ff' }}>已启用 ({currentRow.sync_interval})</Text> : <Text type="secondary">未启用</Text>}</Descriptions.Item>
                                    <Descriptions.Item label="下次同步">{currentRow.next_sync_at ? new Date(currentRow.next_sync_at).toLocaleString() : (currentRow.sync_enabled ? '等待调度' : '-')}</Descriptions.Item>
                                    <Descriptions.Item label="创建时间">{currentRow.created_at ? new Date(currentRow.created_at).toLocaleString() : '-'}</Descriptions.Item>
                                    <Descriptions.Item label="更新时间">{currentRow.updated_at ? new Date(currentRow.updated_at).toLocaleString() : '-'}</Descriptions.Item>
                                    {currentRow.error_message && <Descriptions.Item label="错误" span={2}><Alert type="error" message={currentRow.error_message} style={{ margin: 0 }} /></Descriptions.Item>}
                                </Descriptions>

                                {/* Commits */}
                                <Card size="small" title={<Space><HistoryOutlined />最近提交</Space>}>
                                    {loadingCommits ? <Spin /> : commits.length > 0 ? (
                                        <Timeline items={commits.map(c => ({
                                            children: (
                                                <div>
                                                    <Text code copyable={{ text: c.full_id || c.commit_id }} style={{ fontSize: 11, marginRight: 8 }}>{c.commit_id}</Text>
                                                    <Text>{c.message}</Text>
                                                    <div><Text type="secondary" style={{ fontSize: 11 }}>{c.author} · {new Date(c.date).toLocaleDateString()}</Text></div>
                                                </div>
                                            ),
                                        }))} />
                                    ) : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无提交记录" />}
                                </Card>
                            </>
                        ),
                    },
                    {
                        key: 'logs',
                        label: <><CloudSyncOutlined style={{ marginRight: 4 }} />同步日志</>,
                        children: loadingLogs ? <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div> : syncLogs.length > 0 ? (
                            <div>
                                {syncLogs.map((log: any, index: number) => (
                                    <Card
                                        key={log.id}
                                        size="small"
                                        style={{
                                            marginBottom: index < syncLogs.length - 1 ? 12 : 0,
                                            borderColor: log.status === 'failed' ? '#ffccc7' : '#f0f0f0',
                                            background: log.status === 'failed' ? '#fff2f0' : '#fff',
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                            <Text type="secondary" style={{ fontSize: 12 }}>{new Date(log.created_at).toLocaleString()}</Text>
                                            <Tag color={log.status === 'success' ? 'green' : 'red'}>{log.status === 'success' ? '成功' : '失败'}</Tag>
                                        </div>
                                        <Row gutter={16}>
                                            <Col span={5}><Text type="secondary">触发</Text><div>{log.trigger_type === 'manual' ? '手动' : log.trigger_type === 'create' ? '创建' : log.trigger_type === 'scheduled' ? <Text style={{ color: '#1890ff' }}>定时</Text> : log.trigger_type}</div></Col>
                                            <Col span={5}><Text type="secondary">操作</Text><div>{log.action === 'pull' ? '拉取' : log.action === 'clone' ? '克隆' : log.action || '-'}</div></Col>
                                            <Col span={5}><Text type="secondary">分支</Text><div>{log.branch}</div></Col>
                                            <Col span={6}><Text type="secondary">Commit</Text><div>{log.commit_id ? <Text code copyable={{ text: log.commit_id }} style={{ fontSize: 11 }}>{log.commit_id}</Text> : '-'}</div></Col>
                                            <Col span={3}><Text type="secondary">耗时</Text><div>{log.duration_ms}ms</div></Col>
                                        </Row>
                                        {log.error_message && <Alert type="error" message={log.error_message} style={{ marginTop: 12 }} />}
                                    </Card>
                                ))}
                            </div>
                        ) : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无同步记录" />,
                    },
                ]} />
            </Drawer>
        );
    };

    // ==================== 文件浏览器 ====================
    const renderFileBrowser = () => {
        if (!currentRow) return null;
        return (
            <Modal title={<Space><FolderOutlined />{currentRow.name} - 文件浏览</Space>} open={fileBrowserOpen} onCancel={() => setFileBrowserOpen(false)} footer={null} width={1000} styles={{ body: { padding: 0 } }}>
                <div style={{ display: 'flex', height: 500 }}>
                    <div style={{ width: 260, borderRight: '1px solid #f0f0f0', overflow: 'auto', padding: 8 }}>
                        <Button size="small" icon={<ReloadOutlined spin={loadingFiles} />} onClick={() => loadFileTree(currentRow.id)} loading={loadingFiles} style={{ marginBottom: 8 }}>刷新</Button>
                        {loadingFiles ? <Spin /> : fileTree.length > 0 ? <Tree showLine treeData={fileTree} onSelect={(_, i) => { const n = i.node as DataNode; if (n.isLeaf) loadFileContent(currentRow.id, n.key as string); }} /> : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无" />}
                    </div>
                    <div style={{ flex: 1, overflow: 'auto', background: '#1e1e1e' }}>
                        {loadingContent ? <div style={{ padding: 80, textAlign: 'center' }}><Spin /></div> : fileContent ? (
                            <>
                                <div style={{ padding: '6px 12px', background: '#252526', borderBottom: '1px solid #3c3c3c' }}><Text style={{ color: '#aaa', fontSize: 11 }}>{selectedFilePath}</Text></div>
                                <pre style={{ color: '#d4d4d4', padding: 12, margin: 0, fontSize: 12, fontFamily: 'Consolas, monospace', lineHeight: 1.4, whiteSpace: 'pre-wrap' }}>{fileContent}</pre>
                            </>
                        ) : <div style={{ padding: 80, textAlign: 'center' }}><FileOutlined style={{ fontSize: 32, color: '#555' }} /><div><Text style={{ color: '#888' }}>选择文件</Text></div></div>}
                    </div>
                </div>
            </Modal>
        );
    };

    // ==================== 调度设置 ====================
    const handleSaveSchedule = async () => {
        if (!currentRow) return;
        const values = scheduleForm.getFieldsValue();
        setSavingSchedule(true);
        try {
            // 组合间隔值：数字 + 单位
            let syncInterval = values.sync_interval;
            if (values.interval_value && values.interval_unit) {
                syncInterval = `${values.interval_value}${values.interval_unit}`;
            }
            await updateGitRepo(currentRow.id, {
                sync_enabled: values.sync_enabled,
                sync_interval: syncInterval,
            });
            message.success('调度设置已保存');
            setScheduleModalOpen(false);
            const res = await getGitRepo(currentRow.id);
            setCurrentRow(res.data);
            loadRepos();
        } catch { /* 错误消息由全局错误处理器显示 */ }
        finally { setSavingSchedule(false); }
    };

    const renderScheduleModal = () => {
        return (
            <Modal
                title={<Space><SettingOutlined />定时同步设置</Space>}
                open={scheduleModalOpen}
                onCancel={() => setScheduleModalOpen(false)}
                onOk={handleSaveSchedule}
                confirmLoading={savingSchedule}
                okText="保存"
                width={520}
            >
                <div style={{ padding: '8px 0' }}>
                    <Form form={scheduleForm} layout="vertical">
                        <Form.Item name="sync_enabled" style={{ marginBottom: 16 }}>
                            <div style={{ display: 'flex', gap: 12 }}>
                                <Card
                                    size="small"
                                    hoverable
                                    onClick={() => scheduleForm.setFieldValue('sync_enabled', false)}
                                    style={{
                                        flex: 1,
                                        cursor: 'pointer',
                                        border: !scheduleSyncEnabled ? '2px solid #1890ff' : '1px solid #f0f0f0',
                                        background: !scheduleSyncEnabled ? '#f0f7ff' : '#fff',
                                    }}
                                    styles={{ body: { padding: 16, textAlign: 'center' } }}
                                >
                                    <CloseCircleOutlined style={{ fontSize: 24, color: !scheduleSyncEnabled ? '#1890ff' : '#bfbfbf', marginBottom: 8 }} />
                                    <div><Text strong style={{ color: !scheduleSyncEnabled ? '#1890ff' : '#666' }}>关闭</Text></div>
                                    <Text type="secondary" style={{ fontSize: 12 }}>仅手动同步</Text>
                                </Card>
                                <Card
                                    size="small"
                                    hoverable
                                    onClick={() => scheduleForm.setFieldValue('sync_enabled', true)}
                                    style={{
                                        flex: 1,
                                        cursor: 'pointer',
                                        border: scheduleSyncEnabled ? '2px solid #52c41a' : '1px solid #f0f0f0',
                                        background: scheduleSyncEnabled ? '#f6ffed' : '#fff',
                                    }}
                                    styles={{ body: { padding: 16, textAlign: 'center' } }}
                                >
                                    <CheckCircleOutlined style={{ fontSize: 24, color: scheduleSyncEnabled ? '#52c41a' : '#bfbfbf', marginBottom: 8 }} />
                                    <div><Text strong style={{ color: scheduleSyncEnabled ? '#52c41a' : '#666' }}>开启</Text></div>
                                    <Text type="secondary" style={{ fontSize: 12 }}>自动定时同步</Text>
                                </Card>
                            </div>
                        </Form.Item>

                        {scheduleSyncEnabled && (
                            <>
                                <Form.Item label="同步频率" style={{ marginBottom: 16 }}>
                                    <Space>
                                        <span>每</span>
                                        <Form.Item name="interval_value" noStyle initialValue={1}>
                                            <Select style={{ width: 70 }}>
                                                {[1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 24, 30].map(n => (
                                                    <Select.Option key={n} value={n}>{n}</Select.Option>
                                                ))}
                                            </Select>
                                        </Form.Item>
                                        <Form.Item name="interval_unit" noStyle initialValue="h">
                                            <Select style={{ width: 80 }}>
                                                <Select.Option value="m">分钟</Select.Option>
                                                <Select.Option value="h">小时</Select.Option>
                                                <Select.Option value="d">天</Select.Option>
                                            </Select>
                                        </Form.Item>
                                        <span>同步一次</span>
                                    </Space>
                                </Form.Item>
                                <Alert
                                    type="info"
                                    showIcon
                                    message="同步时会自动拉取最新代码，并触发关联 Playbook 的变量重新扫描"
                                />
                            </>
                        )}
                    </Form>
                </div>
            </Modal>
        );
    };

    // ==================== 表格列 ====================
    const columns = [
        {
            title: '仓库',
            key: 'name',
            width: 350,
            render: (_: any, r: AutoHealing.GitRepository) => {
                const st = statusConfig[r.status] || statusConfig.pending;
                return (
                    <div style={{ cursor: 'pointer' }} onClick={() => handleViewDetail(r)}>
                        <Space><Avatar size={32} style={{ background: '#f5f5f5' }}><GithubOutlined style={{ color: '#333' }} /></Avatar>
                            <div>
                                <Space size={8}>
                                    <Text strong>{r.name}</Text>
                                    <Tag color={st.color}>{st.text}</Tag>
                                    {r.sync_enabled && <Tooltip title="已启用定时同步"><CloudSyncOutlined style={{ color: '#1890ff' }} /></Tooltip>}
                                </Space>
                                <br /><Text type="secondary" style={{ fontSize: 11 }}><BranchesOutlined style={{ marginRight: 2 }} />{r.default_branch || 'main'} · {r.url}</Text>
                            </div>
                        </Space>
                    </div>
                );
            },
        },
        {
            title: 'Commit',
            dataIndex: 'last_commit_id',
            width: 50,
            render: (v: string) => v ? <Text code copyable={{ text: v }} style={{ fontSize: 11 }}>{v}</Text> : '-',
        },
        {
            title: '认证',
            dataIndex: 'auth_type',
            width: 50,
            render: (v: string) => {
                const authLabels: Record<string, { icon: React.ReactNode; text: string }> = {
                    none: { icon: <GlobalOutlined />, text: '公开' },
                    token: { icon: <KeyOutlined />, text: 'Token' },
                    password: { icon: <LockOutlined />, text: '密码' },
                    ssh_key: { icon: <SafetyCertificateOutlined />, text: 'SSH' },
                };
                const auth = authLabels[v] || authLabels.none;
                return <Space size={4}><Text type="secondary">{auth.icon}</Text><Text type="secondary">{auth.text}</Text></Space>;
            },
        },
        {
            title: '同步',
            key: 'sync_info',
            width: 100,
            render: (_: any, r: AutoHealing.GitRepository) => (
                <div>
                    {r.sync_enabled ? <Text style={{ color: '#1890ff' }}>{r.sync_interval}</Text> : <Text type="secondary">-</Text>}
                    {r.last_sync_at && <div><Text type="secondary" style={{ fontSize: 11 }}>{new Date(r.last_sync_at).toLocaleString()}</Text></div>}
                </div>
            ),
        },
        {
            title: '操作', width: 120,
            render: (_: any, r: AutoHealing.GitRepository) => (
                <Space>
                    <Tooltip title="查看"><Button type="text" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(r)} /></Tooltip>
                    <Tooltip title="手动同步"><Button type="text" size="small" icon={<SyncOutlined spin={syncing === r.id} />} onClick={() => handleSync(r)} disabled={syncing === r.id} /></Tooltip>
                    <Tooltip title="文件"><Button type="text" size="small" icon={<FolderOutlined />} onClick={() => { setCurrentRow(r); loadFileTree(r.id); setFileBrowserOpen(true); }} disabled={r.status !== 'ready'} /></Tooltip>
                </Space>
            ),
        },
    ];

    // ==================== 主渲染 ====================
    return (
        <PageContainer
            ghost
            header={{ title: <><GithubOutlined style={{ fontSize: 20 }} /> Git 仓库 / REPOSITORIES</> }}
            extra={[
                <Button key="r" icon={<ReloadOutlined />} onClick={loadRepos}>刷新</Button>,
                <Button key="c" type="primary" icon={<PlusOutlined />} onClick={openCreate}>添加仓库</Button>,
            ]}
        >
            <Card style={{ marginBottom: 16 }} styles={{ body: { padding: '12px 16px' } }}>
                <Row justify="space-between" align="middle">
                    <Space split={<span style={{ color: '#e8e8e8' }}>|</span>} size="middle">
                        <Text>总计 <Text strong>{stats.total}</Text></Text>
                        <Text>就绪 <Text strong style={{ color: '#52c41a' }}>{stats.ready}</Text></Text>
                        <Text>待同步 <Text strong style={{ color: '#8c8c8c' }}>{stats.pending}</Text></Text>
                        <Text>错误 <Text strong style={{ color: '#ff4d4f' }}>{stats.error}</Text></Text>
                    </Space>
                    <Input placeholder="搜索..." prefix={<SearchOutlined />} value={searchText} onChange={e => setSearchText(e.target.value)} allowClear style={{ width: 220 }} />
                </Row>
            </Card>

            <Card>
                <Table rowKey="id" loading={loading} dataSource={filteredRepos} columns={columns} pagination={{ pageSize: 10, showTotal: t => `共 ${t} 条` }}
                    locale={{ emptyText: <Empty description="暂无仓库"><Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>添加第一个</Button></Empty> }} />
            </Card>

            {renderCreateWizard()}
            {renderDrawer()}
            {renderFileBrowser()}
            {renderScheduleModal()}

            <Modal
                title={<><ExclamationCircleOutlined style={{ color: '#ff4d4f', marginRight: 8 }} />确认删除</>}
                open={deleteConfirmOpen}
                onCancel={() => setDeleteConfirmOpen(false)}
                onOk={handleDelete}
                okText="删除"
                okButtonProps={{
                    danger: true,
                    disabled: currentRow ? getRepoPlaybooks(currentRow.id).length > 0 : false
                }}
            >
                {currentRow && getRepoPlaybooks(currentRow.id).length > 0 ? (
                    <Alert
                        type="error"
                        message={<>无法删除：关联 <b>{getRepoPlaybooks(currentRow.id).length}</b> 个 Playbook</>}
                        description="请先删除关联的 Playbook 后再删除此仓库"
                        showIcon
                    />
                ) : (
                    <>确定删除 <Text strong>{currentRow?.name}</Text>？本地代码也会被清除。</>
                )}
            </Modal>
        </PageContainer>
    );
};

export default GitRepoList;
