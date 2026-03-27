import React from 'react';
import { Tag, Typography, Space, Badge } from 'antd';
import {
    CheckCircleOutlined,
    CloseCircleOutlined,
    SyncOutlined,
    ClockCircleOutlined,
    UserOutlined,
    RightOutlined,
    StopOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Text } = Typography;

interface ExecutionStreamProps {
    runs: AutoHealing.ExecutionRun[];
    loading: boolean;
    total: number;
    onSelectRun: (run: AutoHealing.ExecutionRun) => void;
    hasMore?: boolean;
    onLoadMore?: () => void;
}

const ExecutionStream: React.FC<ExecutionStreamProps> = ({
    runs,
    loading,
    total,
    onSelectRun,
    hasMore,
    onLoadMore,
}) => {

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'success': return { color: '#52c41a', icon: <CheckCircleOutlined />, border: '#52c41a', label: '成功' };
            case 'partial': return { color: '#fa8c16', icon: <ClockCircleOutlined />, border: '#fa8c16', label: '部分成功' };
            case 'failed': return { color: '#ff4d4f', icon: <CloseCircleOutlined />, border: '#ff4d4f', label: '失败' };
            case 'running': return { color: '#1890ff', icon: <SyncOutlined spin />, border: '#1890ff', label: '执行中' };
            case 'pending': return { color: '#722ed1', icon: <ClockCircleOutlined />, border: '#722ed1', label: '等待中' };
            case 'timeout': return { color: '#eb2f96', icon: <ClockCircleOutlined />, border: '#eb2f96', label: '超时' };
            case 'cancelled': return { color: '#8c8c8c', icon: <StopOutlined />, border: '#8c8c8c', label: '已取消' };
            default: return { color: '#d9d9d9', icon: <ClockCircleOutlined />, border: '#d9d9d9', label: status };
        }
    };

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
        if (scrollHeight - scrollTop - clientHeight < 50 && onLoadMore && hasMore && !loading) {
            onLoadMore();
        }
    };

    const setRowBackground = (event: React.MouseEvent<HTMLDivElement>, color: string) => {
        event.currentTarget.style.background = color;
    };

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#fff' }}>
            <style>{`
                .exec-stream-scrollbar {
                    scrollbar-width: thin;
                    scrollbar-color: transparent transparent;
                }
                .exec-stream-scrollbar:hover {
                    scrollbar-color: rgba(0,0,0,0.2) transparent;
                }
                .exec-stream-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .exec-stream-scrollbar::-webkit-scrollbar-thumb {
                    background-color: transparent;
                    border-radius: 3px;
                    transition: background-color 0.3s;
                }
                .exec-stream-scrollbar:hover::-webkit-scrollbar-thumb {
                    background-color: rgba(0,0,0,0.2);
                }
                .exec-stream-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
            `}</style>

            {/* Stream header */}
            <div style={{ padding: '12px 24px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Text strong style={{ fontSize: 14 }}>执行流</Text>
                <Badge count={total} style={{ backgroundColor: '#f0f0f0', color: '#8c8c8c' }} overflowCount={9999} />
            </div>

            <div
                className="exec-stream-scrollbar"
                style={{ flex: 1, overflowY: 'auto', padding: 0 }}
                onScroll={handleScroll}
            >
                {runs.map((item) => {
                    const statusConfig = getStatusConfig(item.status);

                    return (
                        <div
                            key={item.id}
                            onClick={() => onSelectRun(item)}
                            style={{
                                padding: '12px 24px',
                                borderBottom: '1px solid #f0f0f0',
                                cursor: 'pointer',
                                position: 'relative',
                                transition: 'background 0.2s',
                                paddingLeft: 28
                            }}
                            onMouseEnter={(event) => setRowBackground(event, '#fafafa')}
                            onMouseLeave={(event) => setRowBackground(event, '#fff')}
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
                                <Space orientation="vertical" size={2}>
                                    <Space>
                                        <Text strong style={{ fontSize: 14 }}>{item.task?.name || 'Unknown Task'}</Text>
                                        <Text copyable={{ text: item.id, tooltips: ['复制 Run ID', '已复制'] }} style={{ fontSize: 11, fontFamily: 'SFMono-Regular, Consolas, monospace', color: '#8c8c8c' }}>
                                            <span style={{ marginRight: 4 }}>Run</span>{item.id}
                                        </Text>
                                    </Space>
                                    <Space size={16} style={{ fontSize: 12, color: '#8c8c8c' }}>
                                        <Space size={4}>
                                            <span style={{ fontFamily: 'SFMono-Regular, Consolas, monospace' }}>#{item.id.slice(0, 8)}</span>
                                        </Space>
                                        <Space size={4}>
                                            {item.triggered_by?.includes('scheduler') ? <ClockCircleOutlined /> : <UserOutlined />}
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
                })}
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
