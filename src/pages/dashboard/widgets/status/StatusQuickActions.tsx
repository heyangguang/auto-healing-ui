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
import { Button, Card, Col, Row } from 'antd';
import { history } from '@umijs/max';
import React from 'react';
import WidgetWrapper from '../WidgetWrapper';
import type { WidgetComponentProps } from '../widgetRegistry';

const QUICK_ACTIONS = [
    { icon: <AlertOutlined />, label: '工单管理', path: '/incidents', color: '#1677ff' },
    { icon: <DeploymentUnitOutlined />, label: '自愈实例', path: '/healing/instances', color: '#722ed1' },
    { icon: <ForkOutlined />, label: '自愈流程', path: '/healing/flows', color: '#2f54eb' },
    { icon: <FileTextOutlined />, label: '执行记录', path: '/execution/runs', color: '#eb2f96' },
    { icon: <ScheduleOutlined />, label: '待办审批', path: '/pending/triggers', color: '#faad14' },
    { icon: <ApiOutlined />, label: '插件管理', path: '/resources/plugins', color: '#531dab' },
    { icon: <CodeOutlined />, label: 'Playbook', path: '/execution/playbooks', color: '#13c2c2' },
    { icon: <BellOutlined />, label: '通知管理', path: '/notification/logs', color: '#fa541c' },
];

const StatusQuickActions: React.FC<WidgetComponentProps> = ({ isEditing, onRemove }) => {
    return (
        <WidgetWrapper title="快速操作" icon={<ToolOutlined />} isEditing={isEditing} onRemove={onRemove}>
            <Row gutter={[8, 8]}>
                {QUICK_ACTIONS.map((action) => (
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
