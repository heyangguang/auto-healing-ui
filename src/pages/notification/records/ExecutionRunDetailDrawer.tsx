import React, { startTransition } from 'react';
import { history } from '@umijs/max';
import { Button, Descriptions, Drawer, Space, Tag, Typography } from 'antd';
import { CloseCircleOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { formatFullTime, getTriggeredByConfig } from './notificationRecordsConfig';

const { Text } = Typography;

interface ExecutionRunDetailDrawerProps {
    execution: AutoHealing.ExecutionRun | null;
    loading: boolean;
    open: boolean;
    onClose: () => void;
}

const ExecutionRunDetailDrawer: React.FC<ExecutionRunDetailDrawerProps> = ({ execution, loading, open, onClose }) => {
    return (
        <Drawer
            title={(
                <Space>
                    <PlayCircleOutlined />
                    <span>执行详情</span>
                    {execution && <Tag color={execution.status === 'success' ? 'green' : execution.status === 'failed' ? 'red' : 'orange'}>{execution.status}</Tag>}
                </Space>
            )}
            size={600}
            open={open}
            onClose={onClose}
            loading={loading}
        >
            {execution && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <Descriptions title="基本信息" column={2} bordered size="small">
                        <Descriptions.Item label="任务模板" span={2}><Text strong>{execution.task?.name || '未知任务'}</Text></Descriptions.Item>
                        <Descriptions.Item label="触发类型">
                            {(() => {
                                const config = getTriggeredByConfig(execution.triggered_by);
                                return <Tag icon={config.icon} color={config.color}>{config.label}</Tag>;
                            })()}
                        </Descriptions.Item>
                        <Descriptions.Item label="执行状态">
                            <Tag color={execution.status === 'success' ? 'green' : execution.status === 'failed' ? 'red' : 'orange'}>{execution.status}</Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="开始时间">{execution.started_at ? formatFullTime(execution.started_at) : '-'}</Descriptions.Item>
                        <Descriptions.Item label="结束时间">{execution.ended_at ? formatFullTime(execution.ended_at) : '-'}</Descriptions.Item>
                        {execution.duration_ms && <Descriptions.Item label="执行耗时" span={2}>{(execution.duration_ms / 1000).toFixed(2)}s</Descriptions.Item>}
                    </Descriptions>

                    {execution.task?.target_hosts && (
                        <div>
                            <Text strong style={{ display: 'block', marginBottom: 8 }}>目标主机</Text>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                {String(execution.task.target_hosts).split(',').map((host: string) => <Tag key={host}>{host}</Tag>)}
                            </div>
                        </div>
                    )}

                    {execution.status === 'failed' && execution.error_message && (
                        <div style={{ padding: '12px 16px', background: '#fff1f0', border: '1px solid #ffccc7' }}>
                            <Space align="start">
                                <CloseCircleOutlined style={{ color: '#ff4d4f', marginTop: 4, fontSize: 16 }} />
                                <div>
                                    <Text strong style={{ color: '#cf1322' }}>执行失败</Text>
                                    <div style={{ marginTop: 4, color: '#cf1322', fontFamily: 'monospace', fontSize: 13 }}>{execution.error_message}</div>
                                </div>
                            </Space>
                        </div>
                    )}

                    <div style={{ textAlign: 'center', paddingTop: 12 }}>
                        <Button type="link" onClick={() => startTransition(() => { onClose(); history.push(`/execution/runs/${execution.id}?from=/notification/records`); })}>
                            查看完整执行日志 →
                        </Button>
                    </div>
                </div>
            )}
        </Drawer>
    );
};

export default ExecutionRunDetailDrawer;
