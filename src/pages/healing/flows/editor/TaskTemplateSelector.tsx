import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Modal, Input, Tree, Typography, Tag, Empty, Spin, Space, Row, Col, Tooltip, Select, Skeleton } from 'antd';
import { SearchOutlined, CodeOutlined, FolderOutlined, CheckCircleOutlined, ExclamationCircleOutlined, BookOutlined, LoadingOutlined } from '@ant-design/icons';
import { getExecutionTasks } from '@/services/auto-healing/execution';
import { getPlaybooks } from '@/services/auto-healing/playbooks';
import { getGitRepos } from '@/services/auto-healing/git-repos';
import type { DataNode } from 'antd/es/tree';

const { Text } = Typography;

interface TaskTemplateSelectorProps {
    open: boolean;
    value?: string;
    onSelect: (id: string, template: any) => void;
    onCancel: () => void;
}

interface TaskTemplate {
    id: string;
    name: string;
    description?: string;
    executor_type: string;
    needs_review?: boolean;
    playbook?: {
        id: string;
        name: string;
        repository_id?: string;
        variables?: any[];
    };
    secrets_source_ids?: string[];
}

const PAGE_SIZE = 50;

const TaskTemplateSelector: React.FC<TaskTemplateSelectorProps> = ({
    open,
    value,
    onSelect,
    onCancel
}) => {
    // 基础数据
    const [repositories, setRepositories] = useState<any[]>([]);
    const [playbooks, setPlaybooks] = useState<any[]>([]);
    const [initLoading, setInitLoading] = useState(true);

    // 任务列表分页
    const [tasks, setTasks] = useState<TaskTemplate[]>([]);
    const [tasksLoading, setTasksLoading] = useState(false);
    const [tasksTotal, setTasksTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const listRef = useRef<HTMLDivElement>(null);

    // 筛选
    const [selectedTreeKey, setSelectedTreeKey] = useState<string>('all');
    const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
    const [search, setSearch] = useState('');
    const [executorType, setExecutorType] = useState<string | undefined>();
    const [statusFilter, setStatusFilter] = useState<string | undefined>();

    // 选择
    const [selectedTaskId, setSelectedTaskId] = useState<string | undefined>(value);
    const [selectedTask, setSelectedTask] = useState<TaskTemplate | null>(null);

    // 初始化加载仓库和 Playbook
    useEffect(() => {
        if (open) {
            loadBaseData();
        } else {
            // 关闭时重置状态
            setTasks([]);
            setPage(1);
            setHasMore(true);
            setSearch('');
            setExecutorType(undefined);
            setStatusFilter(undefined);
            setSelectedTreeKey('all');
        }
    }, [open]);

    useEffect(() => {
        if (value) {
            setSelectedTaskId(value);
        }
    }, [value]);

    // 加载基础数据（仓库、Playbook）
    const loadBaseData = async () => {
        setInitLoading(true);
        try {
            const [playbooksRes, reposRes] = await Promise.all([
                getPlaybooks({ page_size: 100 }),
                getGitRepos()
            ]);
            const pbs = playbooksRes.data || [];
            const repos = reposRes.data || [];

            setPlaybooks(pbs);
            setRepositories(repos);

            // 默认展开前几个仓库
            if (repos.length) {
                setExpandedKeys(repos.slice(0, 3).map((r: any) => `repo-${r.id}`));
            }

            // 加载第一页任务
            await loadTasks(1, true);
        } catch (error) {
            console.error('Failed to load base data:', error);
        } finally {
            setInitLoading(false);
        }
    };

    // 构建筛选参数
    const buildTaskParams = useCallback(() => {
        const params: any = { page_size: PAGE_SIZE };

        // 按树选择过滤
        if (selectedTreeKey !== 'all') {
            if (selectedTreeKey.startsWith('playbook-')) {
                params.playbook_id = selectedTreeKey.replace('playbook-', '');
            } else if (selectedTreeKey.startsWith('repo-')) {
                // 后端可能不直接支持 repository_id 过滤任务，需要用 playbook_id
                // 暂时获取该仓库下所有 playbook 的任务
                const repoId = selectedTreeKey.replace('repo-', '');
                const repoPlaybookIds = playbooks
                    .filter(p => p.repository_id === repoId)
                    .map(p => p.id);
                if (repoPlaybookIds.length === 1) {
                    params.playbook_id = repoPlaybookIds[0];
                }
                // 多个 playbook 的情况后端可能不支持，需要前端过滤
            }
        }

        if (search) params.search = search;
        if (executorType) params.executor_type = executorType;
        if (statusFilter === 'ready') params.status = 'ready';
        else if (statusFilter === 'review') params.status = 'pending_review';

        return params;
    }, [selectedTreeKey, search, executorType, statusFilter, playbooks]);

    // 加载任务列表
    const loadTasks = useCallback(async (pageNum: number, reset: boolean = false) => {
        if (tasksLoading) return;
        setTasksLoading(true);
        try {
            const params = { ...buildTaskParams(), page: pageNum };
            const res = await getExecutionTasks(params);
            const newTasks = res.data || [];
            const total = res.total || 0;

            if (reset) {
                setTasks(newTasks);
            } else {
                setTasks(prev => [...prev, ...newTasks]);
            }

            setTasksTotal(total);
            setPage(pageNum);
            setHasMore(pageNum * PAGE_SIZE < total);

            // 如果是初始加载且有预选值，定位到该任务
            if (reset && value) {
                const found = newTasks.find((t: TaskTemplate) => t.id === value);
                if (found) {
                    setSelectedTask(found);
                    setSelectedTaskId(value);
                }
            }
        } catch (error) {
            console.error('Failed to load tasks:', error);
        } finally {
            setTasksLoading(false);
        }
    }, [buildTaskParams, value, tasksLoading]);

    // 筛选条件变化时重新加载
    useEffect(() => {
        if (!initLoading && open) {
            const timer = setTimeout(() => {
                loadTasks(1, true);
            }, 300);
            return () => clearTimeout(timer);
        }
        return undefined;
    }, [selectedTreeKey, search, executorType, statusFilter, initLoading, open]);

    // 滚动加载更多
    const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
        if (scrollHeight - scrollTop - clientHeight < 100 && !tasksLoading && hasMore) {
            loadTasks(page + 1, false);
        }
    }, [tasksLoading, hasMore, page, loadTasks]);

    // 前端过滤（处理后端不支持的情况，如多 playbook 过滤）
    const displayTasks = useMemo(() => {
        let result = tasks;

        // 如果选择了仓库节点，需要前端过滤多个 playbook
        if (selectedTreeKey.startsWith('repo-')) {
            const repoId = selectedTreeKey.replace('repo-', '');
            const repoPlaybookIds = playbooks
                .filter(p => p.repository_id === repoId)
                .map(p => p.id);
            result = result.filter(t => t.playbook?.id && repoPlaybookIds.includes(t.playbook.id));
        }

        return result;
    }, [tasks, selectedTreeKey, playbooks]);

    // 构建树形数据
    const treeData = useMemo((): DataNode[] => {
        const repoNodes: DataNode[] = repositories.map(repo => {
            const repoPlaybooks = playbooks.filter(p => p.repository_id === repo.id);

            return {
                key: `repo-${repo.id}`,
                title: (
                    <Space>
                        {repo.name}
                        <Tag style={{ fontSize: 10 }}>{repoPlaybooks.length}</Tag>
                    </Space>
                ),
                icon: <FolderOutlined style={{ color: '#1890ff' }} />,
                children: repoPlaybooks.map(playbook => ({
                    key: `playbook-${playbook.id}`,
                    title: playbook.name,
                    icon: <BookOutlined style={{ color: '#52c41a' }} />,
                    isLeaf: true,
                })),
            };
        });

        return [
            {
                key: 'all',
                title: (
                    <Space>
                        全部任务
                        <Tag style={{ fontSize: 10 }}>{tasksTotal}</Tag>
                    </Space>
                ),
                icon: <CodeOutlined style={{ color: '#722ed1' }} />,
                isLeaf: true,
            },
            ...repoNodes
        ];
    }, [repositories, playbooks, tasksTotal]);

    const handleTreeSelect = (keys: React.Key[]) => {
        if (keys.length > 0) {
            setSelectedTreeKey(keys[0] as string);
        }
    };

    const handleTaskSelect = (task: TaskTemplate) => {
        if (task.needs_review) return;
        setSelectedTaskId(task.id);
        setSelectedTask(task);
    };

    const handleConfirm = () => {
        if (selectedTaskId && selectedTask) {
            onSelect(selectedTaskId, selectedTask);
        }
    };

    const getStatusTag = (task: TaskTemplate) => {
        if (task.needs_review) {
            return <Tag icon={<ExclamationCircleOutlined />} color="warning">审核中</Tag>;
        }
        return <Tag icon={<CheckCircleOutlined />} color="success">就绪</Tag>;
    };

    const isDisabled = (task: TaskTemplate) => task.needs_review;

    return (
        <Modal
            title={
                <Space>
                    <CodeOutlined />
                    选择任务模板
                </Space>
            }
            open={open}
            onCancel={onCancel}
            onOk={handleConfirm}
            okText="确定选择"
            okButtonProps={{ disabled: !selectedTaskId || !selectedTask || initLoading }}
            width={1000}
            destroyOnHidden
        >
            <Spin spinning={initLoading} tip="加载中...">
                {/* 搜索和筛选栏 */}
                <Row gutter={12} style={{ marginBottom: 16 }}>
                    <Col span={12}>
                        <Input
                            placeholder="搜索任务名称、描述或 Playbook"
                            prefix={<SearchOutlined />}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            allowClear
                        />
                    </Col>
                    <Col span={6}>
                        <Select
                            placeholder="执行器类型"
                            value={executorType}
                            onChange={setExecutorType}
                            allowClear
                            style={{ width: '100%' }}
                            options={[
                                { label: '本地执行', value: 'local' },
                                { label: 'Docker', value: 'docker' },
                            ]}
                        />
                    </Col>
                    <Col span={6}>
                        <Select
                            placeholder="任务状态"
                            value={statusFilter}
                            onChange={setStatusFilter}
                            allowClear
                            style={{ width: '100%' }}
                            options={[
                                { label: '仅就绪', value: 'ready' },
                                { label: '仅审核中', value: 'review' },
                            ]}
                        />
                    </Col>
                </Row>

                <Row gutter={16} style={{ height: 450 }}>
                    {/* 左侧树 */}
                    <Col span={8} style={{ height: '100%', borderRight: '1px solid #f0f0f0', paddingRight: 16 }}>
                        <div style={{ marginBottom: 8 }}>
                            <Text type="secondary" style={{ fontSize: 12 }}>Git仓库 / Playbook</Text>
                        </div>
                        <div style={{ height: 420, overflow: 'auto' }}>
                            {initLoading ? (
                                <Skeleton active paragraph={{ rows: 10 }} />
                            ) : (
                                <Tree
                                    showIcon
                                    showLine={{ showLeafIcon: false }}
                                    treeData={treeData}
                                    selectedKeys={[selectedTreeKey]}
                                    expandedKeys={expandedKeys}
                                    onSelect={handleTreeSelect}
                                    onExpand={(keys) => setExpandedKeys(keys as string[])}
                                    style={{ fontSize: 13 }}
                                />
                            )}
                        </div>
                    </Col>

                    {/* 右侧列表 */}
                    <Col span={16} style={{ height: '100%', paddingLeft: 8 }}>
                        <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
                            <Text type="secondary" style={{ fontSize: 12 }}>任务模板列表</Text>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                                {selectedTreeKey === 'all' ? `共 ${tasksTotal} 个` : `已加载 ${displayTasks.length} 个`}
                            </Text>
                        </div>
                        <div
                            ref={listRef}
                            style={{ height: 420, overflow: 'auto' }}
                            onScroll={handleScroll}
                        >
                            {initLoading ? (
                                <Skeleton active paragraph={{ rows: 12 }} />
                            ) : displayTasks.length === 0 && !tasksLoading ? (
                                <Empty description="暂无任务模板" style={{ marginTop: 100 }} />
                            ) : (
                                <>
                                    <div>
                                        {displayTasks.map((task) => {
                                            const disabled = isDisabled(task);
                                            const isSelected = task.id === selectedTaskId;

                                            return (
                                                <div
                                                    key={task.id}
                                                    onClick={() => handleTaskSelect(task)}
                                                    style={{
                                                        cursor: disabled ? 'not-allowed' : 'pointer',
                                                        background: isSelected ? '#e6f7ff' : (disabled ? '#fafafa' : 'transparent'),
                                                        opacity: disabled ? 0.5 : 1,
                                                        borderLeft: isSelected ? '3px solid #1890ff' : '3px solid transparent',
                                                        padding: '8px 12px',
                                                        marginBottom: 4,
                                                        borderBottom: '1px solid #f0f0f0',
                                                        borderRadius: 4
                                                    }}
                                                >
                                                    <div style={{ width: '100%' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                                            {getStatusTag(task)}
                                                            <Text strong style={{ fontSize: 13 }}>{task.name}</Text>
                                                            {disabled && (
                                                                <Tooltip title="该任务正在审核中，暂时无法选择">
                                                                    <Tag color="orange" style={{ fontSize: 10 }}>审核中</Tag>
                                                                </Tooltip>
                                                            )}
                                                        </div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 22 }}>
                                                            <Text type="secondary" style={{ fontSize: 11 }}>
                                                                <BookOutlined style={{ marginRight: 4 }} />
                                                                {task.playbook?.name || '-'}
                                                            </Text>
                                                            <Tag style={{ fontSize: 10 }}>
                                                                {task.playbook?.variables?.length || 0} 个变量
                                                            </Tag>
                                                            {task.secrets_source_ids && task.secrets_source_ids.length > 0 ? (
                                                                <Tag color="purple" style={{ fontSize: 10 }}>有密钥</Tag>
                                                            ) : (
                                                                <Tag style={{ fontSize: 10, color: '#999' }}>无密钥</Tag>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    {tasksLoading && (
                                        <div style={{ textAlign: 'center', padding: 12 }}>
                                            <Space>
                                                <LoadingOutlined />
                                                <Text type="secondary">加载中...</Text>
                                            </Space>
                                        </div>
                                    )}
                                    {!hasMore && displayTasks.length > 0 && (
                                        <div style={{ textAlign: 'center', padding: 8, color: '#ccc', fontSize: 12 }}>
                                            已加载全部 {displayTasks.length} 个任务
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </Col>
                </Row>

                {/* 已选择提示 */}
                {selectedTask && (
                    <div style={{
                        marginTop: 16,
                        padding: '8px 12px',
                        background: '#e6f7ff',
                        borderRadius: 6,
                        border: '1px solid #91d5ff'
                    }}>
                        <Text strong>已选择：</Text> {selectedTask.name}
                        <Text type="secondary" style={{ marginLeft: 16 }}>
                            Playbook: {selectedTask.playbook?.name}
                        </Text>
                    </div>
                )}
            </Spin>
        </Modal>
    );
};

export default TaskTemplateSelector;
