import React from 'react';
import { ClockCircleOutlined, ConsoleSqlOutlined, SyncOutlined } from '@ant-design/icons';
import { Alert, Space, Tag, Typography } from 'antd';
import LogConsole, { type LogEntry } from '@/components/execution/LogConsole';

const { Text } = Typography;

interface RunLogPanelProps {
    loading: boolean;
    logLoadError?: string;
    logs: LogEntry[];
    streaming: boolean;
}

const RunLogPanel: React.FC<RunLogPanelProps> = ({
    loading,
    logLoadError,
    logs,
    streaming,
}) => (
    <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        border: '1px dashed #d9d9d9',
        background: '#fafafa',
        borderRadius: 4,
        overflow: 'hidden',
    }}
    >
        <div style={{
            padding: '8px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px dashed #d9d9d9',
            background: '#fff',
        }}
        >
            <Space>
                <ConsoleSqlOutlined style={{ fontSize: 14, color: '#595959' }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: '#8c8c8c', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    执行日志 / EXECUTION LOG
                </span>
            </Space>
            {streaming && <Tag color="processing" icon={<SyncOutlined spin />} style={{ margin: 0, fontSize: 11 }}>LIVE</Tag>}
        </div>

        {logLoadError && (
            <Alert
                type="error"
                showIcon
                banner
                message={logLoadError}
                style={{ borderBottom: '1px solid #ffccc7' }}
            />
        )}

        <div style={{ flex: 1, overflow: 'hidden' }}>
            <LogConsole
                logs={logs}
                loading={loading && logs.length === 0}
                streaming={streaming}
                height="100%"
                theme="dark"
                emptyText={(
                    <div style={{ padding: 40, textAlign: 'center' }}>
                        <Space direction="vertical">
                            <ClockCircleOutlined style={{ fontSize: 24, color: '#d9d9d9' }} />
                            <Text type="secondary">{logLoadError || '暂无日志输出'}</Text>
                        </Space>
                    </div>
                )}
            />
        </div>
    </div>
);

export default RunLogPanel;
