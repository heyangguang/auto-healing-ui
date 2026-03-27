import React, { useMemo } from 'react';
import {
    Alert,
    Card,
    Col,
    Empty,
    Row,
    Space,
    Spin,
    Statistic,
    Tag,
    Typography,
} from 'antd';
import {
    FileTextOutlined,
    SettingOutlined,
} from '@ant-design/icons';

const { Text } = Typography;

type PlaybookScanLogsPanelProps = {
    loadingLogs: boolean;
    scanLogs: AutoHealing.PlaybookScanLog[];
};

const buildLogStats = (logs: AutoHealing.PlaybookScanLog[]) => ({
    total: logs.length,
    latestDate: logs[0] ? new Date(logs[0].created_at).toLocaleDateString() : '-',
    newVariables: logs.reduce((sum, log) => sum + (log.new_count || 0), 0),
    removedVariables: logs.reduce((sum, log) => sum + (log.removed_count || 0), 0),
});

const getTriggerLabel = (triggerType: AutoHealing.PlaybookScanLog['trigger_type']) => {
    if (triggerType === 'manual') return '手动触发';
    if (triggerType === 'auto') return '自动触发';
    return '同步触发';
};

const PlaybookScanLogsPanel: React.FC<PlaybookScanLogsPanelProps> = ({
    loadingLogs,
    scanLogs,
}) => {
    const stats = useMemo(() => buildLogStats(scanLogs), [scanLogs]);

    if (loadingLogs) {
        return <div style={{ padding: 24 }}><Spin /></div>;
    }

    if (scanLogs.length === 0) {
        return (
            <div style={{ padding: 24 }}>
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无扫描记录，点击「扫描变量」开始" />
            </div>
        );
    }

    return (
        <div style={{ padding: 24 }}>
            <Card size="small" style={{ marginBottom: 16, background: '#fafafa' }}>
                <Row gutter={24}>
                    <Col span={6}>
                        <Statistic title="总扫描次数" value={stats.total} styles={{ content: { fontSize: 20 } }} />
                    </Col>
                    <Col span={6}>
                        <Statistic title="最近扫描" value={stats.latestDate} styles={{ content: { fontSize: 14 } }} />
                    </Col>
                    <Col span={6}>
                        <Statistic
                            title="新增变量"
                            value={stats.newVariables}
                            styles={{ content: { fontSize: 20, color: '#52c41a' } }}
                            prefix="+"
                        />
                    </Col>
                    <Col span={6}>
                        <Statistic
                            title="移除变量"
                            value={stats.removedVariables}
                            styles={{ content: { fontSize: 20, color: '#ff4d4f' } }}
                            prefix="-"
                        />
                    </Col>
                </Row>
            </Card>

            <div>
                {scanLogs.map((log, index) => (
                    <Card
                        key={log.id}
                        size="small"
                        style={{
                            marginBottom: 12,
                            borderLeft: `3px solid ${log.error_message ? '#ff4d4f' : '#52c41a'}`,
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <Space style={{ marginBottom: 8 }}>
                                    <Text strong>{new Date(log.created_at).toLocaleString()}</Text>
                                    <Tag color={log.trigger_type === 'manual' ? 'blue' : 'green'}>
                                        {getTriggerLabel(log.trigger_type)}
                                    </Tag>
                                    {index === 0 && <Tag color="gold">最新</Tag>}
                                </Space>
                                <div>
                                    <Space size={24}>
                                        <Text type="secondary">
                                            <FileTextOutlined style={{ marginRight: 4 }} />
                                            扫描 {log.files_scanned || 0} 个文件
                                        </Text>
                                        <Text type="secondary">
                                            <SettingOutlined style={{ marginRight: 4 }} />
                                            发现 {log.variables_found || 0} 个变量
                                        </Text>
                                        {(log.new_count || 0) > 0 && (
                                            <Text style={{ color: '#52c41a' }}>+{log.new_count} 新增</Text>
                                        )}
                                        {(log.removed_count || 0) > 0 && (
                                            <Text style={{ color: '#ff4d4f' }}>-{log.removed_count} 移除</Text>
                                        )}
                                    </Space>
                                </div>
                                {log.error_message && (
                                    <Alert type="error" message={log.error_message} style={{ marginTop: 8 }} showIcon />
                                )}
                            </div>
                            <Tag color={log.error_message ? 'error' : 'success'}>
                                {log.error_message ? '失败' : '成功'}
                            </Tag>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default PlaybookScanLogsPanel;
