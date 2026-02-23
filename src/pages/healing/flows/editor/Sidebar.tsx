import React from 'react';
import { Typography, Collapse } from 'antd';
import {
    CloudServerOutlined,
    SafetyCertificateOutlined,
    AuditOutlined,
    CodeOutlined,
    BellOutlined,
    BranchesOutlined,
    FunctionOutlined,
    DragOutlined,
    AppstoreOutlined,
    CalculatorOutlined,
} from '@ant-design/icons';

const { Text } = Typography;

interface NodeTypeItem {
    type: string;
    label: string;
    icon: React.ReactNode;
    color: string;
    description: string;
}
import { NODE_TYPE_COLORS } from '../../nodeConfig';

const nodeGroups: { title: string; items: NodeTypeItem[] }[] = [
    {
        title: '数据处理',
        items: [
            { type: 'host_extractor', label: '主机提取', icon: <CloudServerOutlined />, color: NODE_TYPE_COLORS.host_extractor, description: '从告警提取主机' },
            { type: 'cmdb_validator', label: 'CMDB校验', icon: <SafetyCertificateOutlined />, color: NODE_TYPE_COLORS.cmdb_validator, description: '验证主机状态' },
            { type: 'set_variable', label: '设置变量', icon: <FunctionOutlined />, color: NODE_TYPE_COLORS.set_variable, description: '设置上下文变量' },
            { type: 'compute', label: '计算节点', icon: <CalculatorOutlined />, color: NODE_TYPE_COLORS.compute, description: '表达式计算' },
        ],
    },
    {
        title: '流程控制',
        items: [
            { type: 'condition', label: '条件分支', icon: <BranchesOutlined />, color: NODE_TYPE_COLORS.condition, description: '根据条件分流' },
            { type: 'approval', label: '人工审批', icon: <AuditOutlined />, color: NODE_TYPE_COLORS.approval, description: '需人工确认' },
            { type: 'end', label: '结束节点', icon: <AppstoreOutlined />, color: NODE_TYPE_COLORS.end, description: '流程终点' },
        ],
    },
    {
        title: '执行动作',
        items: [
            { type: 'execution', label: '任务执行', icon: <CodeOutlined />, color: NODE_TYPE_COLORS.execution, description: '执行自动化任务' },
            { type: 'notification', label: '发送通知', icon: <BellOutlined />, color: NODE_TYPE_COLORS.notification, description: '发送告警通知' },
        ],
    },
];

const Sidebar: React.FC = () => {
    const onDragStart = (event: React.DragEvent, nodeType: string, label: string) => {
        event.dataTransfer.setData('application/reactflow', nodeType);
        event.dataTransfer.setData('application/label', label);
        event.dataTransfer.effectAllowed = 'move';
    };

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#fafafa', marginLeft: 0, paddingLeft: 0 }}>
            <div style={{
                padding: '16px',
                borderBottom: '1px solid #f0f0f0',
                background: '#fff',
                display: 'flex',
                alignItems: 'center',
                gap: 8
            }}>
                <AppstoreOutlined style={{ fontSize: 16, color: '#1890ff' }} />
                <Text strong style={{ fontSize: 15 }}>组件库</Text>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: 0 }}>
                {nodeGroups.map((group, groupIndex) => (
                    <div key={groupIndex}>
                        <div style={{ padding: '12px 16px 8px', background: '#fafafa' }}>
                            <Text type="secondary" style={{ fontSize: 13, fontWeight: 600 }}>{group.title}</Text>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            {group.items.map((item) => (
                                <div
                                    key={item.type}
                                    onDragStart={(event) => onDragStart(event, item.type, item.label)}
                                    draggable
                                    title={item.description}
                                    style={{
                                        padding: '12px 16px',
                                        background: '#fff',
                                        borderBottom: '1px solid #f5f5f5',
                                        borderLeft: `3px solid ${item.color}`,
                                        cursor: 'grab',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        transition: 'all 0.2s',
                                        marginLeft: 0,
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = `${item.color}08`;
                                        e.currentTarget.style.boxShadow = 'inset 0 0 0 1px ' + item.color + '30';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = '#fff';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <span style={{
                                            color: item.color,
                                            fontSize: 18,
                                            display: 'flex',
                                            width: 32,
                                            height: 32,
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            background: `${item.color}12`,
                                            borderRadius: 4
                                        }}>
                                            {item.icon}
                                        </span>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <Text style={{ fontSize: 14, fontWeight: 500 }}>{item.label}</Text>
                                            <Text type="secondary" style={{ fontSize: 12 }}>{item.description}</Text>
                                        </div>
                                    </div>
                                    <DragOutlined style={{ color: '#d9d9d9', fontSize: 14 }} />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ padding: '12px 16px', borderTop: '1px solid #f0f0f0', background: '#fff' }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                    拖拽组件到画布
                </Text>
            </div>
        </div>
    );
};

export default Sidebar;
