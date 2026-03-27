import React, { useMemo } from 'react';
import { Button, Col, Empty, Input, Row, Select, Skeleton, Space, Tag, Tooltip, Tree, Typography } from 'antd';
import { BookOutlined, CheckCircleOutlined, CodeOutlined, ExclamationCircleOutlined, FolderOutlined, LoadingOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import type { DataNode } from 'antd/es/tree';
import type { TaskTemplate, TaskTemplateStatusFilter } from './taskTemplateSelectorTypes';
import type { useTaskTemplateSelectorState } from './useTaskTemplateSelectorState';

const { Text } = Typography;
type TaskTemplateSelectorViewProps = ReturnType<typeof useTaskTemplateSelectorState>;
const PANEL_HEIGHT = 420;

function TaskTemplateSelectorFilters({
    executorType,
    search,
    setExecutorType,
    setSearch,
    setStatusFilter,
    statusFilter,
}: TaskTemplateSelectorViewProps) {
    return (
        <Row gutter={12} style={{ marginBottom: 16 }}>
            <Col span={12}>
                <Input
                    placeholder="搜索任务名称、描述或 Playbook"
                    prefix={<SearchOutlined />}
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
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
                <Select<TaskTemplateStatusFilter>
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
    );
}
function TaskTemplateTreePanel({
    expandedKeys,
    handleTreeSelect,
    initLoading,
    playbooks,
    repositories,
    selectedTreeKey,
    setExpandedKeys,
    tasksTotal,
}: TaskTemplateSelectorViewProps) {
    const treeData = useMemo((): DataNode[] => {
        const repoNodes = repositories.map((repository) => {
            const repoPlaybooks = playbooks.filter((playbook) => playbook.repository_id === repository.id);
            return {
                key: `repo-${repository.id}`,
                title: (
                    <Space>
                        {repository.name}
                        <Tag style={{ fontSize: 10 }}>{repoPlaybooks.length}</Tag>
                    </Space>
                ),
                icon: <FolderOutlined style={{ color: '#1890ff' }} />,
                children: repoPlaybooks.map((playbook) => ({
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
            ...repoNodes,
        ];
    }, [playbooks, repositories, tasksTotal]);

    return (
        <Col span={8} style={{ height: '100%', borderRight: '1px solid #f0f0f0', paddingRight: 16 }}>
            <div style={{ marginBottom: 8 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>Git仓库 / Playbook</Text>
            </div>
            <div style={{ height: PANEL_HEIGHT, overflow: 'auto' }}>
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
    );
}
function renderStatusTag(task: TaskTemplate) {
    if (task.needs_review) {
        return <Tag icon={<ExclamationCircleOutlined />} color="warning">审核中</Tag>;
    }
    return <Tag icon={<CheckCircleOutlined />} color="success">就绪</Tag>;
}
function TaskTemplateListHeader({
    displayTasks,
    initLoading,
    refresh,
    selectedTreeKey,
    tasksLoading,
    tasksTotal,
}: TaskTemplateSelectorViewProps) {
    return (
        <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
            <Text type="secondary" style={{ fontSize: 12 }}>任务模板列表</Text>
            <Space size={8}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                    {selectedTreeKey === 'all' ? `共 ${tasksTotal} 个` : `已加载 ${displayTasks.length} 个`}
                </Text>
                <Tooltip title="刷新任务、Playbook 和仓库列表">
                    <Button
                        size="small"
                        icon={<ReloadOutlined />}
                        loading={initLoading || tasksLoading}
                        onClick={refresh}
                    />
                </Tooltip>
            </Space>
        </div>
    );
}
function TaskTemplateCard({
    handleTaskSelect,
    selectedTaskId,
    task,
}: Pick<TaskTemplateSelectorViewProps, 'handleTaskSelect' | 'selectedTaskId'> & { task: TaskTemplate }) {
    const disabled = Boolean(task.needs_review);
    const selected = task.id === selectedTaskId;
    return (
        <div
            key={task.id}
            onClick={() => handleTaskSelect(task)}
            style={{
                cursor: disabled ? 'not-allowed' : 'pointer',
                background: selected ? '#e6f7ff' : (disabled ? '#fafafa' : 'transparent'),
                opacity: disabled ? 0.5 : 1,
                borderLeft: selected ? '3px solid #1890ff' : '3px solid transparent',
                padding: '8px 12px',
                marginBottom: 4,
                borderBottom: '1px solid #f0f0f0',
                borderRadius: 4,
            }}
        >
            <div style={{ width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    {renderStatusTag(task)}
                    <Text strong style={{ fontSize: 13 }}>{task.name}</Text>
                    {disabled ? (
                        <Tooltip title="该任务正在审核中，暂时无法选择">
                            <Tag color="orange" style={{ fontSize: 10 }}>审核中</Tag>
                        </Tooltip>
                    ) : null}
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
}
function TaskTemplateListPanel(props: TaskTemplateSelectorViewProps) {
    const { displayTasks, handleScroll, initLoading, selectedTaskId, tasksLoading } = props;
    return (
        <Col span={16} style={{ height: '100%', paddingLeft: 8 }}>
            <TaskTemplateListHeader {...props} />
            <div style={{ height: PANEL_HEIGHT, overflow: 'auto' }} onScroll={handleScroll}>
                {initLoading ? (
                    <Skeleton active paragraph={{ rows: 12 }} />
                ) : displayTasks.length === 0 && !tasksLoading ? (
                    <Empty description="暂无任务模板" style={{ marginTop: 100 }} />
                ) : (
                    <>
                        <div>
                            {displayTasks.map((task) => (
                                <TaskTemplateCard
                                    key={task.id}
                                    task={task}
                                    selectedTaskId={selectedTaskId}
                                    handleTaskSelect={props.handleTaskSelect}
                                />
                            ))}
                        </div>
                        {tasksLoading ? (
                            <div style={{ textAlign: 'center', padding: 12 }}>
                                <Space>
                                    <LoadingOutlined />
                                    <Text type="secondary">加载中...</Text>
                                </Space>
                            </div>
                        ) : null}
                        {!props.hasMore && displayTasks.length > 0 ? (
                            <div style={{ textAlign: 'center', padding: 8, color: '#ccc', fontSize: 12 }}>
                                已加载全部 {displayTasks.length} 个任务
                            </div>
                        ) : null}
                    </>
                )}
            </div>
        </Col>
    );
}
function TaskTemplateSelectedBanner({ selectedTask }: TaskTemplateSelectorViewProps) {
    if (!selectedTask) {
        return null;
    }
    return (
        <div
            style={{
                marginTop: 16,
                padding: '8px 12px',
                background: '#e6f7ff',
                borderRadius: 6,
                border: '1px solid #91d5ff',
            }}
        >
            <Text strong>已选择：</Text> {selectedTask.name}
            <Text type="secondary" style={{ marginLeft: 16 }}>
                Playbook: {selectedTask.playbook?.name}
            </Text>
        </div>
    );
}
const TaskTemplateSelectorView: React.FC<TaskTemplateSelectorViewProps> = (props) => {
    return (
        <>
            <TaskTemplateSelectorFilters {...props} />
            <Row gutter={16} style={{ height: 450 }}>
                <TaskTemplateTreePanel {...props} />
                <TaskTemplateListPanel {...props} />
            </Row>
            <TaskTemplateSelectedBanner {...props} />
        </>
    );
};

export default TaskTemplateSelectorView;
