import React from 'react';
import {
    BookOutlined,
    CodeOutlined,
    FileTextOutlined,
    LoadingOutlined,
    SearchOutlined,
} from '@ant-design/icons';
import {
    Col,
    Empty,
    Input,
    Modal,
    Row,
    Select,
    Skeleton,
    Space,
    Spin,
    Tag,
    Tree,
    Typography,
} from 'antd';
import type { DataNode } from 'antd/es/tree';
import { findPlaybookById } from './blacklistRuleFormUtils';

const { Text } = Typography;

type Props = {
    confirmLoading: boolean;
    displayTasks: AutoHealing.ExecutionTask[];
    executorType?: string;
    expandedKeys: string[];
    hasMore: boolean;
    initLoading: boolean;
    open: boolean;
    pendingTask: AutoHealing.ExecutionTask | null;
    pendingPlaybook?: AutoHealing.Playbook;
    playbookList: AutoHealing.Playbook[];
    selectedTreeKey: string;
    statusFilter?: string;
    taskSearch: string;
    tasksLoading: boolean;
    tasksTotal: number;
    treeData: DataNode[];
    onCancel: () => void;
    onConfirm: () => void;
    onExecutorTypeChange: (value?: string) => void;
    onExpandedKeysChange: (keys: string[]) => void;
    onPendingTaskChange: (task: AutoHealing.ExecutionTask) => void;
    onScroll: (event: React.UIEvent<HTMLDivElement>) => void;
    onSelectedTreeKeyChange: (key: string) => void;
    onStatusFilterChange: (value?: string) => void;
    onTaskSearchChange: (value: string) => void;
};

const BlacklistTaskTemplateSelectorModal: React.FC<Props> = ({
    confirmLoading,
    displayTasks,
    executorType,
    expandedKeys,
    hasMore,
    initLoading,
    open,
    pendingTask,
    pendingPlaybook,
    playbookList,
    selectedTreeKey,
    statusFilter,
    taskSearch,
    tasksLoading,
    tasksTotal,
    treeData,
    onCancel,
    onConfirm,
    onExecutorTypeChange,
    onExpandedKeysChange,
    onPendingTaskChange,
    onScroll,
    onSelectedTreeKeyChange,
    onStatusFilterChange,
    onTaskSearchChange,
}) => (
    <Modal
        title={
            <Space>
                <CodeOutlined />
                选择任务模板 — 仿真测试
            </Space>
        }
        open={open}
        onCancel={onCancel}
        onOk={onConfirm}
        confirmLoading={confirmLoading}
        okText="确认加载"
        okButtonProps={{ disabled: !pendingTask || initLoading || confirmLoading }}
        width={1000}
        destroyOnHidden
    >
        <Spin spinning={initLoading} tip="加载中...">
            <Row gutter={12} style={{ marginBottom: 16 }}>
                <Col span={12}>
                    <Input
                        placeholder="搜索任务名称..."
                        prefix={<SearchOutlined />}
                        value={taskSearch}
                        onChange={(event) => onTaskSearchChange(event.target.value)}
                        allowClear
                    />
                </Col>
                <Col span={6}>
                    <Select
                        placeholder="执行器类型"
                        value={executorType}
                        onChange={onExecutorTypeChange}
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
                        onChange={onStatusFilterChange}
                        allowClear
                        style={{ width: '100%' }}
                        options={[
                            { label: '仅就绪', value: 'ready' },
                            { label: '仅审核中', value: 'review' },
                        ]}
                    />
                </Col>
            </Row>

            <Row gutter={16} style={{ height: 420 }}>
                <Col span={8} style={{ height: '100%', borderRight: '1px solid #f0f0f0', paddingRight: 16 }}>
                    <div style={{ marginBottom: 8 }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>Git仓库 / Playbook</Text>
                    </div>
                    <div style={{ height: 390, overflow: 'auto' }}>
                        {initLoading ? (
                            <Skeleton active paragraph={{ rows: 10 }} />
                        ) : (
                            <Tree
                                showIcon
                                showLine={{ showLeafIcon: false }}
                                treeData={treeData}
                                selectedKeys={[selectedTreeKey]}
                                expandedKeys={expandedKeys}
                                onSelect={(keys) => keys.length > 0 && onSelectedTreeKeyChange(keys[0] as string)}
                                onExpand={(keys) => onExpandedKeysChange(keys as string[])}
                                style={{ fontSize: 13 }}
                            />
                        )}
                    </div>
                </Col>

                <Col span={16} style={{ height: '100%', paddingLeft: 8 }}>
                    <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>任务模板列表</Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            {selectedTreeKey === 'all' ? `共 ${tasksTotal} 个` : `已筛选 ${displayTasks.length} 个`}
                        </Text>
                    </div>
                    <div style={{ height: 390, overflow: 'auto' }} onScroll={onScroll}>
                        {initLoading ? (
                            <Skeleton active paragraph={{ rows: 12 }} />
                        ) : displayTasks.length === 0 && !tasksLoading ? (
                            <Empty description="暂无任务模板" style={{ marginTop: 100 }} />
                        ) : (
                            <>
                                {displayTasks.map((task) => {
                                    const isSelected = task.id === pendingTask?.id;
                                    const hasPlaybook = !!task.playbook_id;
                                    const playbook = findPlaybookById(playbookList, task.playbook_id);

                                    return (
                                        <div
                                            key={task.id}
                                            onClick={() => hasPlaybook && onPendingTaskChange(task)}
                                            className={`blacklist-sim-task-item ${isSelected ? 'selected' : ''} ${!hasPlaybook ? 'disabled' : ''}`}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                                                <Text strong style={{ fontSize: 13 }}>{task.name}</Text>
                                                {!hasPlaybook && <Tag color="default" style={{ fontSize: 10 }}>无 Playbook</Tag>}
                                            </div>
                                            {playbook && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <Text type="secondary" style={{ fontSize: 11 }}>
                                                        <BookOutlined style={{ marginRight: 4 }} />
                                                        {playbook.name}
                                                    </Text>
                                                    <Text type="secondary" style={{ fontSize: 11 }}>
                                                        <FileTextOutlined style={{ marginRight: 2 }} />
                                                        {playbook.file_path}
                                                    </Text>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                                {tasksLoading && (
                                    <div style={{ textAlign: 'center', padding: 12 }}>
                                        <Space><LoadingOutlined /><Text type="secondary">加载中...</Text></Space>
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

            {pendingTask && (
                <div
                    style={{
                        marginTop: 12,
                        padding: '8px 12px',
                        background: '#e6f7ff',
                        border: '1px solid #91d5ff',
                    }}
                >
                    <Text strong>已选择：</Text> {pendingTask.name}
                    {pendingPlaybook && (
                        <Text type="secondary" style={{ marginLeft: 16 }}>
                            Playbook: {pendingPlaybook.name}
                        </Text>
                    )}
                </div>
            )}
        </Spin>
    </Modal>
);

export default BlacklistTaskTemplateSelectorModal;
