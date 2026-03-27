import React from 'react';
import {
    Descriptions,
    Drawer,
    Empty,
    Tabs,
    Tag,
    Typography,
} from 'antd';
import {
    BugOutlined,
    DashboardOutlined,
    FileTextOutlined,
    InfoCircleOutlined,
} from '@ant-design/icons';
import JsonPrettyView from '../components/JsonPrettyView';
import { INSTANCE_STATUS_LABELS } from '@/constants/instanceDicts';
import InstanceExecutionResultTab from './InstanceExecutionResultTab';

type InstanceContextDrawerProps = {
    contextData: Record<string, unknown>;
    instance?: AutoHealing.FlowInstance | null;
    instanceStatus: string;
    onClose: () => void;
    open: boolean;
};

const getHeaderColor = (instanceStatus: string) => {
    if (instanceStatus === 'failed') return '#ff4d4f';
    if (instanceStatus === 'completed') return '#52c41a';
    if (instanceStatus === 'running') return '#1890ff';
    return '#faad14';
};

const InstanceContextIncidentTab: React.FC<{ incident: Record<string, unknown> }> = ({ incident }) => (
    <div style={{ padding: 24 }}>
        <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="告警标题" span={2}>
                <Typography.Text strong>{String(incident.title || '-')}</Typography.Text>
            </Descriptions.Item>
            <Descriptions.Item label="严重等级">
                <Tag color={incident.severity === 'critical' ? 'red' : incident.severity === 'high' ? 'orange' : 'blue'}>
                    {String(incident.severity || '-')}
                </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="状态">{String(incident.status || '-')}</Descriptions.Item>
            <Descriptions.Item label="影响 CI">{String(incident.affected_ci || '-')}</Descriptions.Item>
            <Descriptions.Item label="影响服务">{String(incident.affected_service || '-')}</Descriptions.Item>
            <Descriptions.Item label="分类">{String(incident.category || '-')}</Descriptions.Item>
            <Descriptions.Item label="优先级">{String(incident.priority || '-')}</Descriptions.Item>
            <Descriptions.Item label="报告人">{String(incident.reporter || '-')}</Descriptions.Item>
            <Descriptions.Item label="处理人">{String(incident.assignee || '-')}</Descriptions.Item>
            {Boolean(incident.description) && (
                <Descriptions.Item label="描述" span={2}>
                    <div style={{ whiteSpace: 'pre-wrap' }}>{String(incident.description)}</div>
                </Descriptions.Item>
            )}
            {Boolean(incident.raw_data) && (
                <Descriptions.Item label="原始数据" span={2}>
                    <pre style={{ background: '#fafafa', padding: 12, borderRadius: 6, fontSize: 12, margin: 0, fontFamily: 'Menlo, Monaco, Consolas, monospace' }}>
                        {JSON.stringify(incident.raw_data, null, 2)}
                    </pre>
                </Descriptions.Item>
            )}
        </Descriptions>
    </div>
);

const InstanceGlobalContextTab: React.FC<{ contextData: Record<string, unknown> }> = ({ contextData }) => (
    <div style={{ padding: 24, height: 'calc(100vh - 160px)', overflow: 'auto' }}>
        {Object.keys(contextData).length > 0 ? (
            <JsonPrettyView data={contextData} />
        ) : (
            <Empty description="暂无上下文数据" style={{ marginTop: 80 }} />
        )}
    </div>
);

const InstanceContextDrawer: React.FC<InstanceContextDrawerProps> = ({
    contextData,
    instance,
    instanceStatus,
    onClose,
    open,
}) => {
    const statusColor = getHeaderColor(instanceStatus);
    const incident = contextData.incident as Record<string, unknown> | undefined;

    return (
        <Drawer title={null} placement="right" size={600} onClose={onClose} open={open} styles={{ header: { display: 'none' }, body: { padding: 0 } }}>
            <div
                style={{
                    background: `linear-gradient(135deg, ${statusColor}12 0%, #ffffff 100%)`,
                    padding: '24px 24px 20px',
                    color: '#262626',
                    borderBottom: `2px solid ${statusColor}30`,
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div
                        style={{
                            width: 40,
                            height: 40,
                            borderRadius: 10,
                            background: `${statusColor}15`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 20,
                            color: statusColor,
                        }}
                    >
                        <DashboardOutlined />
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 18, fontWeight: 600, color: '#262626' }}>{instance?.flow_name || '未知流程'}</div>
                        <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 2 }}>
                            {instance?.created_at ? new Date(instance.created_at).toLocaleString('zh-CN') : ''}
                            {instance?.completed_at ? ` → ${new Date(instance.completed_at).toLocaleString('zh-CN')}` : ''}
                        </div>
                    </div>
                    <Tag color={instanceStatus === 'completed' ? 'success' : instanceStatus === 'failed' ? 'error' : instanceStatus === 'running' ? 'processing' : 'warning'} style={{ borderRadius: 12, fontSize: 12 }}>
                        {INSTANCE_STATUS_LABELS[instanceStatus] || instanceStatus}
                    </Tag>
                </div>
            </div>
            <Tabs
                defaultActiveKey="result"
                tabBarStyle={{ padding: '0 24px', marginBottom: 0 }}
                items={[
                    {
                        key: 'result',
                        label: <span><FileTextOutlined /> 执行结果</span>,
                        children: <InstanceExecutionResultTab contextData={contextData} instance={instance} instanceStatus={instanceStatus} />,
                    },
                    ...(incident ? [{
                        key: 'incident',
                        label: <span><BugOutlined /> 关联告警</span>,
                        children: <InstanceContextIncidentTab incident={incident} />,
                    }] : []),
                    {
                        key: 'context',
                        label: <span><InfoCircleOutlined /> 全局上下文</span>,
                        children: <InstanceGlobalContextTab contextData={contextData} />,
                    },
                ]}
            />
        </Drawer>
    );
};

export default InstanceContextDrawer;
