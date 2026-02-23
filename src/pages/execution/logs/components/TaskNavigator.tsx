import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Card, Typography, Space, Badge, Tag, Tooltip } from 'antd';
import {
    AuditOutlined, RocketOutlined, FileTextOutlined,
    DesktopOutlined, CloudServerOutlined,
} from '@ant-design/icons';
import { getExecutionTasks } from '@/services/auto-healing/execution';

const { Text } = Typography;

interface TaskFilters {
    search?: string;
    name?: string;
    description?: string;
    executor_type?: string;
    target_hosts?: string;
    playbook_name?: string;
    repository_name?: string;
    status?: string;
    has_runs?: boolean;
    has_logs?: boolean;
    needs_review?: boolean;
    min_run_count?: number;
    last_run_status?: string;
}

interface TaskNavigatorProps {
    selectedTaskId?: string;
    onSelectTask: (id: string | undefined) => void;
    /** 来自 StandardTable 统一搜索的外部筛选参数 */
    externalFilters?: TaskFilters;
}

import { EXECUTOR_TYPE_CONFIG } from '@/constants/executionDicts';

/* 执行器类型配置（从集中化字典 + 本地 icon 组装） */
const EXECUTOR_ICON_MAP: Record<string, React.ReactNode> = {
    local: <DesktopOutlined />,
    docker: <CloudServerOutlined />,
    ssh: <RocketOutlined />,
};
const executorConfig: Record<string, { icon: React.ReactNode; label: string; color: string }> = Object.fromEntries(
    Object.entries(EXECUTOR_TYPE_CONFIG).map(([k, v]) => [
        k, { icon: EXECUTOR_ICON_MAP[k] || <DesktopOutlined />, label: v.label, color: v.color },
    ])
);

/* 解析 hosts */
const parseHosts = (hosts?: string) => {
    if (!hosts) return [];
    return hosts.split(',').map(h => h.trim()).filter(Boolean);
};

const TaskNavigator: React.FC<TaskNavigatorProps> = ({
    selectedTaskId,
    onSelectTask,
    externalFilters = {},
}) => {
    const [tasks, setTasks] = useState<AutoHealing.ExecutionTask[]>([]);
    const [loading, setLoading] = useState(false);

    // Pagination State
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const PAGE_SIZE = 10;

    const loadingRef = useRef(false);
    const externalFiltersRef = useRef(externalFilters);
    externalFiltersRef.current = externalFilters;

    const fetchTasks = useCallback(async (currentPage: number, isReset: boolean) => {
        if (loadingRef.current) return;
        loadingRef.current = true;
        setLoading(true);
        try {
            const ef = externalFiltersRef.current;
            const res = await getExecutionTasks({
                page: currentPage,
                page_size: PAGE_SIZE,
                name: ef.name,
                description: ef.description,
                executor_type: ef.executor_type,
                target_hosts: ef.target_hosts,
                playbook_name: ef.playbook_name,
                repository_name: ef.repository_name,
                status: ef.status,
                has_runs: ef.has_runs,
                has_logs: ef.has_logs,
                needs_review: ef.needs_review,
                min_run_count: ef.min_run_count,
                last_run_status: ef.last_run_status,
            });
            const newTasks = res.data || [];

            if (isReset) {
                setTasks(newTasks);
            } else {
                setTasks(prev => [...prev, ...newTasks]);
            }

            setHasMore(newTasks.length === PAGE_SIZE);
            setPage(currentPage);
        } catch (e) {
            console.error(e);
        } finally {
            loadingRef.current = false;
            setLoading(false);
        }
    }, []);

    // Reload on external filter changes
    useEffect(() => {
        fetchTasks(1, true);
    }, [
        externalFilters.name,
        externalFilters.description,
        externalFilters.search,
        externalFilters.executor_type,
        externalFilters.target_hosts,
        externalFilters.playbook_name,
        externalFilters.repository_name,
        externalFilters.status,
        externalFilters.has_runs,
        externalFilters.has_logs,
        externalFilters.needs_review,
        externalFilters.min_run_count,
        externalFilters.last_run_status,
    ]);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
        if (scrollHeight - scrollTop - clientHeight < 50 && !loading && hasMore) {
            fetchTasks(page + 1, false);
        }
    };

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', borderRight: '1px solid #f0f0f0', background: '#fff' }}>
            {/* Header */}
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text strong style={{ fontSize: 14 }}>模板分组</Text>
                <Badge count={tasks.length} style={{ backgroundColor: '#f0f0f0', color: '#8c8c8c' }} overflowCount={999} />
            </div>

            <style>{`
                .exec-logs-scrollbar {
                    scrollbar-width: thin;
                    scrollbar-color: transparent transparent;
                }
                .exec-logs-scrollbar:hover {
                    scrollbar-color: rgba(0,0,0,0.2) transparent;
                }
                .exec-logs-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .exec-logs-scrollbar::-webkit-scrollbar-thumb {
                    background-color: transparent;
                    border-radius: 3px;
                    transition: background-color 0.3s;
                }
                .exec-logs-scrollbar:hover::-webkit-scrollbar-thumb {
                    background-color: rgba(0,0,0,0.2);
                }
                .exec-logs-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .task-nav-card .ant-card-body { padding: 10px 12px !important; }
                .task-nav-card:hover .task-nav-name { color: #1677ff; }
                .task-nav-card { position: relative; cursor: pointer; }
                .task-nav-card-selected::before {
                    content: '';
                    position: absolute;
                    left: -1px; top: -1px; bottom: -1px;
                    width: 3px;
                    background: #1890ff;
                    z-index: 1;
                }
            `}</style>

            <div
                className="exec-logs-scrollbar"
                style={{ flex: 1, overflowY: 'auto', padding: 8 }}
                onScroll={handleScroll}
            >
                {/* "全部日志流" card */}
                <Card
                    hoverable
                    size="small"
                    className="task-nav-card"
                    style={{
                        borderRadius: 0,
                        marginBottom: 6,
                        background: !selectedTaskId ? '#e6f7ff' : '#fff',
                        borderColor: !selectedTaskId ? '#1890ff' : '#f0f0f0'
                    }}
                    onClick={() => onSelectTask(undefined)}
                >
                    <Space>
                        <AuditOutlined style={{ color: '#1677ff' }} />
                        <Text strong>全部日志流</Text>
                    </Space>
                </Card>

                {tasks.map((item) => {
                    const isSelected = selectedTaskId === item.id;
                    const exec = executorConfig[item.executor_type] || executorConfig.local;
                    const hosts = parseHosts(item.target_hosts);
                    const playbookName = item.playbook?.name || '-';
                    const filePath = item.playbook?.file_path;

                    return (
                        <Card
                            key={item.id}
                            hoverable
                            size="small"
                            className={`task-nav-card${isSelected ? ' task-nav-card-selected' : ''}`}
                            style={{
                                borderRadius: 0,
                                marginBottom: 6,
                                background: isSelected ? '#e6f7ff' : undefined,
                                borderColor: isSelected ? '#1890ff' : '#f0f0f0',
                            }}
                            onClick={() => onSelectTask(item.id)}
                        >
                            {/* Row 1: Task Name + Executor Tag */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, flex: 1 }}>
                                    <RocketOutlined style={{ color: '#1677ff', fontSize: 13, flexShrink: 0 }} />
                                    <Text strong ellipsis className="task-nav-name" style={{ fontSize: 13 }}>
                                        {item.name}
                                    </Text>
                                </div>
                                <Tag
                                    color={exec.color}
                                    style={{ margin: 0, fontSize: 10, lineHeight: '16px', padding: '0 4px', flexShrink: 0 }}
                                >
                                    {exec.label}
                                </Tag>
                            </div>

                            {/* Row 2: Playbook ID */}
                            <div style={{ paddingLeft: 19, marginBottom: 2 }}>
                                <Text type="secondary" copyable={{ text: item.playbook_id, tooltips: ['复制 Playbook ID', '已复制'] }} style={{ fontSize: 11, fontFamily: 'SFMono-Regular, Consolas, monospace' }}>
                                    <span style={{ color: '#8c8c8c', fontFamily: 'inherit', marginRight: 4 }}>Playbook</span>{item.playbook_id.slice(0, 12)}...
                                </Text>
                            </div>

                            {/* Row 3: Playbook Name + File Path */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4, paddingLeft: 19 }}>
                                <FileTextOutlined style={{ fontSize: 11, color: '#8c8c8c', flexShrink: 0 }} />
                                <Text type="secondary" ellipsis style={{ fontSize: 11 }}>
                                    {playbookName}
                                </Text>
                                {filePath && (
                                    <Text type="secondary" style={{ fontSize: 10, fontFamily: 'SFMono-Regular, Consolas, monospace', flexShrink: 0 }}>
                                        ({filePath})
                                    </Text>
                                )}
                            </div>

                            {/* Row 3: Target Hosts */}
                            <div style={{ paddingLeft: 19 }}>
                                {hosts.length > 0 ? (
                                    <Tooltip title={hosts.join(', ')}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                                            <DesktopOutlined style={{ fontSize: 10, color: '#8c8c8c' }} />
                                            <Text type="secondary" style={{ fontSize: 11, fontFamily: 'SFMono-Regular, Consolas, monospace' }}>
                                                {hosts.length <= 2
                                                    ? hosts.join(', ')
                                                    : `${hosts[0]}, ${hosts[1]} +${hosts.length - 2}`
                                                }
                                            </Text>
                                            {hosts.length > 2 && (
                                                <span style={{
                                                    fontSize: 10, color: '#1677ff', background: '#e6f4ff',
                                                    padding: '0 4px', lineHeight: '16px',
                                                }}>
                                                    {hosts.length} 台
                                                </span>
                                            )}
                                        </div>
                                    </Tooltip>
                                ) : (
                                    <Text type="secondary" style={{ fontSize: 11, color: '#d9d9d9' }}>未配置主机</Text>
                                )}
                            </div>
                        </Card>
                    );
                })}
                {loading && (
                    <div style={{ textAlign: 'center', padding: 8, color: '#999' }}>
                        <Space><div className="ant-spin-dot ant-spin-dot-spin"><i className="ant-spin-dot-item"></i><i className="ant-spin-dot-item"></i><i className="ant-spin-dot-item"></i><i className="ant-spin-dot-item"></i></div> 加载中...</Space>
                    </div>
                )}
                {!hasMore && tasks.length > 0 && (
                    <div style={{ textAlign: 'center', padding: 8, color: '#ccc', fontSize: 12 }}>
                        没有更多数据了
                    </div>
                )}
            </div>
        </div>
    );
};

export default TaskNavigator;
