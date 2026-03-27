import {
    AlertOutlined,
    ApiOutlined,
    BellOutlined,
    CodeOutlined,
    DeploymentUnitOutlined,
    FileTextOutlined,
    ForkOutlined,
    ScheduleOutlined,
    ToolOutlined,
} from '@ant-design/icons';
import { Card, Col, Row } from 'antd';
import { history, useAccess } from '@umijs/max';
import React from 'react';
import WidgetWrapper from '../WidgetWrapper';
import type { WidgetComponentProps } from '../widgetRegistry';

type AccessKey =
    | 'canViewPlugins'
    | 'canViewInstances'
    | 'canViewFlows'
    | 'canViewTasks'
    | 'canViewPendingCenter'
    | 'canViewPlaybooks'
    | 'canViewNotifications';

type AccessState = Partial<Record<AccessKey, boolean>>;

const QUICK_ACTIONS: Array<{ icon: React.ReactNode; label: string; path: string; color: string; access: AccessKey }> = [
    { icon: <AlertOutlined />, label: '工单管理', path: '/resources/incidents', color: '#1677ff', access: 'canViewPlugins' },
    { icon: <DeploymentUnitOutlined />, label: '自愈实例', path: '/healing/instances', color: '#722ed1', access: 'canViewInstances' },
    { icon: <ForkOutlined />, label: '自愈流程', path: '/healing/flows', color: '#2f54eb', access: 'canViewFlows' },
    { icon: <FileTextOutlined />, label: '执行记录', path: '/execution/runs', color: '#eb2f96', access: 'canViewTasks' },
    { icon: <ScheduleOutlined />, label: '待办中心', path: '/pending', color: '#faad14', access: 'canViewPendingCenter' },
    { icon: <ApiOutlined />, label: '插件管理', path: '/resources/plugins', color: '#531dab', access: 'canViewPlugins' },
    { icon: <CodeOutlined />, label: 'Playbook', path: '/execution/playbooks', color: '#13c2c2', access: 'canViewPlaybooks' },
    { icon: <BellOutlined />, label: '通知管理', path: '/notification/records', color: '#fa541c', access: 'canViewNotifications' },
];

const StatusQuickActions: React.FC<WidgetComponentProps> = ({ isEditing, onRemove }) => {
    const access = useAccess();
    const typedAccess = access as AccessState;
    const availableActions = QUICK_ACTIONS.filter((action) => {
        if (!action.access) return true;
        return Boolean(typedAccess[action.access]);
    });

    return (
        <WidgetWrapper title="快速操作" icon={<ToolOutlined />} isEditing={isEditing} onRemove={onRemove}>
            <Row gutter={[8, 8]}>
                {availableActions.map((action) => (
                    <Col span={6} key={action.path}>
                        <Card
                            hoverable
                            size="small"
                            style={{ textAlign: 'center', borderRadius: 6, cursor: 'pointer' }}
                            styles={{ body: { padding: '8px 4px' } }}
                            onClick={() => history.push(action.path)}
                        >
                            <div style={{ fontSize: 20, color: action.color, marginBottom: 4 }}>{action.icon}</div>
                            <div style={{ fontSize: 11, color: '#595959' }}>{action.label}</div>
                        </Card>
                    </Col>
                ))}
            </Row>
        </WidgetWrapper>
    );
};
export default StatusQuickActions;
