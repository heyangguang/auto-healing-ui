import React, { useEffect, useState } from 'react';
import { List, Card, Typography, Space, Input, Badge, Tag, Select, Popover, Button, Switch, Segmented } from 'antd';
import { SearchOutlined, FilterOutlined, DesktopOutlined, CodeOutlined, AuditOutlined, RocketOutlined } from '@ant-design/icons';
import { getExecutionTasks } from '@/services/auto-healing/execution';
import dayjs from 'dayjs';

const { Text } = Typography;
const { Option } = Select;

interface TaskNavigatorProps {
    loading: boolean;
    selectedTaskId?: string;
    onSelectTask: (id: string | undefined) => void;
}

const TaskNavigator: React.FC<TaskNavigatorProps> = ({
    selectedTaskId,
    onSelectTask,
}) => {
    const [tasks, setTasks] = useState<AutoHealing.ExecutionTask[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState('');

    // Pagination State
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const PAGE_SIZE = 20;

    // New Filters
    const [executorType, setExecutorType] = useState<string | undefined>(undefined);
    const [targetHost, setTargetHost] = useState<string>('');
    const [playbookName, setPlaybookName] = useState<string>('');
    const [repoName, setRepoName] = useState<string>('');
    const [lastRunStatus, setLastRunStatus] = useState<string | undefined>(undefined);
    const [hasRuns, setHasRuns] = useState<boolean | undefined>(true);
    const [minRunCount, setMinRunCount] = useState<number | undefined>(undefined);

    const fetchTasks = async (currentPage: number, isReset: boolean) => {
        if (loading) return;
        setLoading(true);
        try {
            const res = await getExecutionTasks({
                page: currentPage,
                page_size: PAGE_SIZE,
                search: searchText,
                executor_type: executorType,
                target_hosts: targetHost,
                playbook_name: playbookName,
                repository_name: repoName,
                has_runs: hasRuns,
                min_run_count: minRunCount,
                last_run_status: lastRunStatus
            });
            const newTasks = res.data || [];

            if (isReset) {
                setTasks(newTasks);
            } else {
                setTasks(prev => [...prev, ...newTasks]);
            }

            // Check if we have more data
            setHasMore(newTasks.length === PAGE_SIZE);
            setPage(currentPage);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    // Reload tasks when filters change (Reset to page 1)
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchTasks(1, true);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchText, targetHost, playbookName, repoName, hasRuns, minRunCount, lastRunStatus]);

    useEffect(() => {
        fetchTasks(1, true);
    }, [executorType]);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
        // Trigger load when scrolled to within 50px of bottom
        if (scrollHeight - scrollTop - clientHeight < 50 && !loading && hasMore) {
            fetchTasks(page + 1, false);
        }
    };

    const FilterContent = (
        <div style={{ width: 280, padding: 8 }}>
            <Space direction="vertical" style={{ width: '100%' }} size={12}>
                <Text strong>筛选任务</Text>

                <div>
                    <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 6 }}>执行记录</div>
                    <Segmented
                        block
                        options={[
                            { label: '不限', value: 'all' },
                            { label: '有记录', value: 'yes' },
                            { label: '无记录', value: 'no' }
                        ]}
                        value={hasRuns === undefined ? 'all' : hasRuns ? 'yes' : 'no'}
                        onChange={(v) => setHasRuns(v === 'all' ? undefined : v === 'yes')}
                    />
                </div>

                <Input
                    placeholder="最小执行次数 (如: 5)"
                    type="number"
                    min={0}
                    value={minRunCount}
                    onChange={e => setMinRunCount(e.target.value ? Number(e.target.value) : undefined)}
                    allowClear
                />
                <Select
                    placeholder="最后执行状态"
                    style={{ width: '100%' }}
                    allowClear
                    onChange={setLastRunStatus}
                    value={lastRunStatus}
                >
                    <Option value="success"><Tag color="success">成功</Tag></Option>
                    <Option value="failed"><Tag color="error">失败</Tag></Option>
                    <Option value="running"><Tag color="processing">执行中</Tag></Option>
                    <Option value="pending"><Tag color="warning">等待中</Tag></Option>
                    <Option value="timeout"><Tag color="#fa8c16">超时</Tag></Option>
                    <Option value="cancelled"><Tag color="default">已取消</Tag></Option>
                </Select>
                <Select
                    placeholder="执行方式"
                    style={{ width: '100%' }}
                    allowClear
                    onChange={setExecutorType}
                    value={executorType}
                >
                    <Option value="local">Local Node (Shell/Ansible)</Option>
                    <Option value="docker">Docker Container</Option>
                </Select>
                <Input
                    placeholder="目标主机 (支持模糊搜索)"
                    value={targetHost}
                    onChange={e => setTargetHost(e.target.value)}
                    allowClear
                    suffix={<DesktopOutlined style={{ color: '#bfbfbf' }} />}
                />
                <Input
                    placeholder="剧本名称"
                    value={playbookName}
                    onChange={e => setPlaybookName(e.target.value)}
                    allowClear
                    suffix={<CodeOutlined style={{ color: '#bfbfbf' }} />}
                />
                <Input
                    placeholder="仓库名称"
                    value={repoName}
                    onChange={e => setRepoName(e.target.value)}
                    allowClear
                    suffix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                />
            </Space>
        </div>
    );


    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', borderRight: '1px solid #f0f0f0', background: '#fff' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0' }}>
                <Space style={{ marginBottom: 12, justifyContent: 'space-between', width: '100%' }}>
                    <Text strong style={{ fontSize: 16 }}>任务导航</Text>
                    <Popover content={FilterContent} trigger="click" placement="bottomRight">
                        <Button
                            icon={<FilterOutlined />}
                            size="small"
                            type={(executorType || targetHost || playbookName || repoName || lastRunStatus || hasRuns !== true || minRunCount) ? 'primary' : 'default'}
                            ghost={!!(executorType || targetHost || playbookName || repoName || lastRunStatus || hasRuns !== true || minRunCount)}
                        />
                    </Popover>
                </Space>
                <Input
                    placeholder="搜索任务模板..."
                    prefix={<SearchOutlined style={{ color: searchText ? '#1890ff' : '#bfbfbf' }} />}
                    value={searchText}
                    onChange={e => setSearchText(e.target.value)}
                    style={{
                        borderRadius: 0,
                        borderColor: searchText ? '#1890ff' : undefined,
                        boxShadow: searchText ? '0 0 0 2px rgba(24,144,255,0.2)' : undefined
                    }}
                    allowClear
                />
            </div>

            <style>{`
                .hide-scrollbar {
                    scrollbar-width: thin;
                    scrollbar-color: transparent transparent;
                }
                .hide-scrollbar:hover {
                    scrollbar-color: rgba(0,0,0,0.2) transparent;
                }
                .hide-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .hide-scrollbar::-webkit-scrollbar-thumb {
                    background-color: transparent;
                    border-radius: 3px;
                    transition: background-color 0.3s;
                }
                .hide-scrollbar:hover::-webkit-scrollbar-thumb {
                    background-color: rgba(0,0,0,0.2);
                }
                .hide-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
            `}</style>
            <div
                className="hide-scrollbar"
                style={{ flex: 1, overflowY: 'auto', padding: 12 }}
                onScroll={handleScroll}
            >
                <Card
                    hoverable
                    size="small"
                    style={{
                        borderRadius: 0,
                        marginBottom: 8,
                        background: !selectedTaskId ? '#e6f7ff' : '#fff',
                        borderColor: !selectedTaskId ? '#1890ff' : '#f0f0f0'
                    }}
                    onClick={() => onSelectTask(undefined)}
                >
                    <Space>
                        <AuditOutlined />
                        <Text strong>全部日志流</Text>
                    </Space>
                </Card>

                <List
                    dataSource={tasks}
                    renderItem={(item) => {
                        const isSelected = selectedTaskId === item.id;
                        return (
                            <Card
                                hoverable
                                size="small"
                                style={{
                                    borderRadius: 0,
                                    marginBottom: 8,
                                    background: isSelected ? '#e6f7ff' : '#fff',
                                    borderColor: isSelected ? '#1890ff' : '#f0f0f0',
                                    transition: 'all 0.2s'
                                }}
                                onClick={() => onSelectTask(item.id)}
                            >
                                <Space direction="vertical" size={2} style={{ width: '100%' }}>
                                    <Space>
                                        <RocketOutlined style={{ color: '#1890ff' }} />
                                        <Text strong ellipsis style={{ maxWidth: 180 }}>{item.name}</Text>
                                    </Space>
                                    <Text type="secondary" style={{ fontSize: 12, marginLeft: 20 }}>
                                        {item.playbook?.name || item.playbook_id.slice(0, 8)}
                                    </Text>
                                    <Space style={{ marginLeft: 20, marginTop: 4 }}>
                                        <Tag style={{ margin: 0, fontSize: 10 }}>{item.executor_type}</Tag>
                                        <Text type="secondary" style={{ fontSize: 11, fontFamily: 'Fira Code' }}>
                                            {item.target_hosts ? item.target_hosts.slice(0, 15) + (item.target_hosts.length > 15 ? '...' : '') : 'No Hosts'}
                                        </Text>
                                    </Space>
                                </Space>
                            </Card>
                        );
                    }}
                />
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
