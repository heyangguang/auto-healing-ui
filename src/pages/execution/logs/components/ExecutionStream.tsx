import { List, Tag, Typography, Space, Button, Badge, Input, Select, DatePicker } from 'antd';
import {
    CheckCircleOutlined,
    CloseCircleOutlined,
    SyncOutlined,
    ClockCircleOutlined,
    UserOutlined,
    RightOutlined,
    StopOutlined,
    SearchOutlined,
    ReloadOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

interface ExecutionStreamProps {
    runs: AutoHealing.ExecutionRun[];
    loading: boolean;
    onSelectRun: (run: AutoHealing.ExecutionRun) => void;
    total: number;
    onLoadMore?: () => void;
    // New Filter Props
    onSearch: (value: string) => void;
    onStatusChange: (status: string | undefined) => void;
    onRefresh: () => void;
    hasMore?: boolean;
    onLoadMore?: () => void;
    // Advanced Filters
    onDateRangeChange: (dates: any) => void;
    onTriggerChange: (trigger: string | undefined) => void;
}

const ExecutionStream: React.FC<ExecutionStreamProps> = ({
    runs,
    loading,
    onSelectRun,
    total,
    onSearch,
    onStatusChange,
    onRefresh,
    hasMore,
    onLoadMore,
    onDateRangeChange,
    onTriggerChange,
}) => {

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'success': return { color: '#52c41a', icon: <CheckCircleOutlined />, border: '#52c41a', label: '成功' };       // 绿色
            case 'partial': return { color: '#fa8c16', icon: <ClockCircleOutlined />, border: '#fa8c16', label: '部分成功' }; // 橙色
            case 'failed': return { color: '#ff4d4f', icon: <CloseCircleOutlined />, border: '#ff4d4f', label: '失败' };       // 红色
            case 'running': return { color: '#1890ff', icon: <SyncOutlined spin />, border: '#1890ff', label: '执行中' };   // 蓝色
            case 'pending': return { color: '#722ed1', icon: <ClockCircleOutlined />, border: '#722ed1', label: '等待中' }; // 紫色
            case 'timeout': return { color: '#eb2f96', icon: <ClockCircleOutlined />, border: '#eb2f96', label: '超时' };     // 洋红色
            case 'cancelled': return { color: '#8c8c8c', icon: <StopOutlined />, border: '#8c8c8c', label: '已取消' };     // 灰色
            default: return { color: '#d9d9d9', icon: <ClockCircleOutlined />, border: '#d9d9d9', label: status };
        }
    };

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
        if (scrollHeight - scrollTop - clientHeight < 50 && onLoadMore && hasMore && !loading) {
            onLoadMore();
        }
    };

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#fff' }}>
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
            <div style={{ padding: '12px 24px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Space>
                    <Text strong style={{ fontSize: 16 }}>执行流</Text>
                    <Badge count={total} style={{ backgroundColor: '#f0f0f0', color: '#8c8c8c' }} />
                </Space>
                <Space>
                    <Input.Search
                        placeholder="搜索 Run ID / 用户"
                        allowClear
                        onSearch={onSearch}
                        style={{ width: 220, borderRadius: 0 }}
                    />
                    <Select
                        placeholder="状态"
                        allowClear
                        style={{ width: 120 }}
                        onChange={onStatusChange}
                    >
                        <Option value="success"><Tag color="#52c41a">成功</Tag></Option>
                        <Option value="partial"><Tag color="#fa8c16">部分成功</Tag></Option>
                        <Option value="failed"><Tag color="#ff4d4f">失败</Tag></Option>
                        <Option value="running"><Tag color="#1890ff">执行中</Tag></Option>
                        <Option value="pending"><Tag color="#722ed1">等待中</Tag></Option>
                        <Option value="timeout"><Tag color="#eb2f96">超时</Tag></Option>
                        <Option value="cancelled"><Tag color="#8c8c8c">已取消</Tag></Option>
                    </Select>
                    <Select
                        placeholder="来源"
                        allowClear
                        style={{ width: 160 }}
                        onChange={onTriggerChange}
                    >
                        <Option value="manual">手动触发</Option>
                        <Option value="scheduler:cron">Cron 调度</Option>
                        <Option value="scheduler:once">一次性调度</Option>
                        <Option value="healing">自愈触发</Option>
                    </Select>
                    <RangePicker
                        placeholder={['开始日期', '结束日期']}
                        style={{ width: 240, borderRadius: 0 }}
                        onChange={onDateRangeChange}
                    />
                    <Button icon={<ReloadOutlined />} onClick={onRefresh} />
                </Space>
            </div>

            <div
                className="hide-scrollbar"
                style={{ flex: 1, overflowY: 'auto', padding: 0 }}
                onScroll={handleScroll}
            >
                <List
                    dataSource={runs} // Use runs directly, remove loading prop from List to manual handle loading spinner at bottom
                    renderItem={(item) => {
                        const statusConfig = getStatusConfig(item.status);

                        return (
                            <div
                                onClick={() => onSelectRun(item)}
                                style={{
                                    padding: '12px 24px',
                                    borderBottom: '1px solid #f0f0f0',
                                    cursor: 'pointer',
                                    position: 'relative',
                                    transition: 'background 0.2s',
                                    paddingLeft: 28 // Space for status strip
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = '#fafafa'}
                                onMouseLeave={(e) => e.currentTarget.style.background = '#fff'}
                            >
                                {/* Status Strip */}
                                <div style={{
                                    position: 'absolute',
                                    left: 0,
                                    top: 0,
                                    bottom: 0,
                                    width: 4,
                                    background: statusConfig.border
                                }} />

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <Space direction="vertical" size={2}>
                                        <Space>
                                            <Text strong style={{ fontSize: 14 }}>{item.task?.name || 'Unknown Task'}</Text>
                                            <Tag bordered={false} style={{ fontSize: 11 }}>
                                                {item.task?.playbook_id}
                                            </Tag>
                                        </Space>
                                        <Space size={16} style={{ fontSize: 12, color: '#8c8c8c' }}>
                                            <Space size={4}>
                                                <span style={{ fontFamily: 'Fira Code' }}>#{item.id.slice(0, 8)}</span>
                                            </Space>
                                            <Space size={4}>
                                                {item.triggered_by && item.triggered_by.includes('scheduler') ? <ClockCircleOutlined /> : <UserOutlined />}
                                                <span>{item.triggered_by}</span>
                                            </Space>
                                            <Space size={4}>
                                                <ClockCircleOutlined />
                                                <span>{item.started_at ? dayjs(item.started_at).format('MMM D, HH:mm:ss') : '-'}</span>
                                            </Space>
                                        </Space>
                                    </Space>

                                    <div style={{ textAlign: 'right' }}>
                                        <Space>
                                            <Tag color={statusConfig.color} style={{ margin: 0, border: 'none' }}>
                                                <Space size={4}>
                                                    {statusConfig.icon}
                                                    {statusConfig.label}
                                                </Space>
                                            </Tag>
                                            <RightOutlined style={{ color: '#d9d9d9', fontSize: 10 }} />
                                        </Space>
                                        {item.completed_at && item.started_at && (
                                            <div style={{ marginTop: 4, fontSize: 11, fontFamily: 'Fira Code', color: '#bfbfbf' }}>
                                                {dayjs(item.completed_at).diff(dayjs(item.started_at), 'second')}s
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    }}
                />
                {loading && (
                    <div style={{ textAlign: 'center', padding: '12px 0', color: '#999' }}>
                        <Space><div className="ant-spin-dot ant-spin-dot-spin"><i className="ant-spin-dot-item"></i><i className="ant-spin-dot-item"></i><i className="ant-spin-dot-item"></i><i className="ant-spin-dot-item"></i></div> 加载中...</Space>
                    </div>
                )}
                {!hasMore && runs.length > 0 && (
                    <div style={{ textAlign: 'center', padding: '12px 0', color: '#ccc', fontSize: 12 }}>
                        没有更多记录了
                    </div>
                )}
            </div>
        </div>
    );
};

export default ExecutionStream;
