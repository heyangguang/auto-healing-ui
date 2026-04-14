import React from 'react';
import { Drawer, Tabs, Tag } from 'antd';
import {
    BugOutlined,
    DashboardOutlined,
    FileTextOutlined,
    InfoCircleOutlined,
    ToolOutlined,
} from '@ant-design/icons';
import type { FlowRecoveryAttempt } from '@/services/auto-healing/instances';
import { INSTANCE_STATUS_LABELS } from '@/constants/instanceDicts';
import InstanceExecutionResultTab from './InstanceExecutionResultTab';
import InstanceGlobalContextTab from './InstanceGlobalContextTab';
import InstanceContextIncidentTab from './InstanceContextIncidentTab';
import InstanceRecoveryAttemptsCard from './InstanceRecoveryAttemptsCard';

type InstanceContextDrawerProps = {
    contextData: Record<string, unknown>;
    instance?: AutoHealing.FlowInstance | null;
    instanceStatus: string;
    onClose: () => void;
    onRecover: () => void;
    open: boolean;
    recoverSubmitting: boolean;
    recoveryAttempts: FlowRecoveryAttempt[];
    recoveryAttemptsLoading: boolean;
    showRecoverAction: boolean;
};

const getHeaderColor = (instanceStatus: string) => {
    if (instanceStatus === 'failed') return '#ff4d4f';
    if (instanceStatus === 'completed') return '#52c41a';
    if (instanceStatus === 'running') return '#1890ff';
    return '#faad14';
};

const InstanceContextDrawer: React.FC<InstanceContextDrawerProps> = ({
    contextData,
    instance,
    instanceStatus,
    onClose,
    onRecover,
    open,
    recoverSubmitting,
    recoveryAttempts,
    recoveryAttemptsLoading,
    showRecoverAction,
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
                        label: <span><BugOutlined /> 关联工单</span>,
                        children: <InstanceContextIncidentTab incident={incident} />,
                    }] : []),
                    {
                        key: 'context',
                        label: <span><InfoCircleOutlined /> 全局上下文</span>,
                        children: <InstanceGlobalContextTab contextData={contextData} />,
                    },
                    {
                        key: 'recovery',
                        label: <span><ToolOutlined /> 恢复记录</span>,
                        children: (
                            <div style={{ padding: 20 }}>
                                <InstanceRecoveryAttemptsCard
                                    attempts={recoveryAttempts}
                                    loading={recoveryAttemptsLoading}
                                    mode="drawer"
                                    onRecover={onRecover}
                                    recoverSubmitting={recoverSubmitting}
                                    showRecoverAction={showRecoverAction}
                                />
                            </div>
                        ),
                    },
                ]}
            />
        </Drawer>
    );
};

export default InstanceContextDrawer;
