import React from 'react';
import {
    Descriptions,
    Drawer,
    Empty,
    Tag,
    Typography,
} from 'antd';
import { AlertOutlined } from '@ant-design/icons';

type InstanceIncidentDrawerProps = {
    incident?: AutoHealing.FlowInstance['incident'];
    onClose: () => void;
    open: boolean;
};

const getSeverityColor = (severity?: string | null) => {
    if (severity === 'critical') return 'red';
    if (severity === 'high') return 'orange';
    if (severity === 'medium') return 'gold';
    return 'blue';
};

const getSeverityBackground = (severity?: string | null) => {
    if (severity === 'critical') return '#ff4d4f';
    if (severity === 'high') return '#ff7a45';
    return '#faad14';
};

const InstanceIncidentDrawer: React.FC<InstanceIncidentDrawerProps> = ({
    incident,
    onClose,
    open,
}) => {
    if (!incident) {
        return (
            <Drawer title={null} placement="right" size={600} onClose={onClose} open={open} styles={{ header: { display: 'none' }, body: { padding: 0 } }}>
                <Empty description="无工单信息" style={{ marginTop: 120 }} />
            </Drawer>
        );
    }

    const accentColor = getSeverityBackground(incident.severity);

    return (
        <Drawer title={null} placement="right" size={600} onClose={onClose} open={open} styles={{ header: { display: 'none' }, body: { padding: 0 } }}>
            <div style={{ background: `linear-gradient(135deg, ${accentColor}12 0%, #ffffff 100%)`, padding: '24px 24px 20px', color: '#262626', borderBottom: `2px solid ${accentColor}30` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: `${accentColor}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: accentColor }}>
                        <AlertOutlined />
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 18, fontWeight: 600, color: '#262626' }}>{incident.title}</div>
                        <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 2 }}>{incident.id || '无 ID'}</div>
                    </div>
                    <Tag color={getSeverityColor(incident.severity)} style={{ borderRadius: 12, fontSize: 12 }}>
                        {incident.severity || 'Unknown'}
                    </Tag>
                </div>
            </div>
            <div style={{ padding: '16px 24px' }}>
                <Descriptions column={2} size="small" bordered labelStyle={{ background: '#fafafa', fontWeight: 500, width: 100 }}>
                    <Descriptions.Item label="工单 ID" span={2}>
                        <Typography.Text copyable style={{ fontSize: 12, fontFamily: 'monospace' }}>{incident.id}</Typography.Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="严重等级">
                        <Tag color={getSeverityColor(incident.severity)}>{incident.severity || '-'}</Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="状态">
                        <Tag color={incident.status === 'Active' ? 'processing' : 'default'}>{incident.status || '-'}</Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="创建时间">{incident.created_at ? new Date(incident.created_at).toLocaleString('zh-CN') : '-'}</Descriptions.Item>
                    <Descriptions.Item label="分类">{incident.category || '-'}</Descriptions.Item>
                    {incident.affected_ci && <Descriptions.Item label="影响 CI">{incident.affected_ci}</Descriptions.Item>}
                    {incident.assignee && <Descriptions.Item label="处理人">{incident.assignee}</Descriptions.Item>}
                    {incident.description && (
                        <Descriptions.Item label="描述" span={2}>
                            <div style={{ whiteSpace: 'pre-wrap', fontSize: 13, lineHeight: 1.6, color: '#595959' }}>{incident.description}</div>
                        </Descriptions.Item>
                    )}
                </Descriptions>
            </div>
        </Drawer>
    );
};

export default InstanceIncidentDrawer;
