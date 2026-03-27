import React, { useEffect, useRef, useState } from 'react';
import { Drawer, Divider, Space, Tabs, Typography } from 'antd';
import { ProForm, ProFormText } from '@ant-design/pro-components';
import { FileTextOutlined, SettingOutlined } from '@ant-design/icons';
import { NODE_TYPE_CONFIG as nodeTypeConfig } from '../../nodeConfig';
import { NodeDetailPanelLogs } from './NodeDetailPanelLogs';
import { NodeDetailPanelSettings } from './NodeDetailPanelSettings';
import { NodeDetailPanelSidebar } from './NodeDetailPanelSidebar';
import { getStatusIcon } from './NodeDetailPanelShared';
import type { NodeDetailFormApi, NodeDetailFormRef, NodeDetailPanelProps } from './NodeDetailPanel.types';

const { Text } = Typography;

const DRAWER_BODY_STYLE = { padding: 0, display: 'flex', flexDirection: 'column' } as const;
const LOGS_DRAWER_WIDTH = 720;
const SETTINGS_DRAWER_WIDTH = 640;
const LOGS_TAB_HEIGHT = 'calc(100vh - 105px)';
const SETTINGS_TAB_HEIGHT = 'calc(100vh - 160px)';

const NodeDetailPanel: React.FC<NodeDetailPanelProps> = ({
    node,
    allNodes,
    allEdges,
    open,
    onClose,
    onChange,
    onNodeSelect,
    onRetry
}) => {
    const formRef = useRef<NodeDetailFormApi>(null) as NodeDetailFormRef;
    const [activeTab, setActiveTab] = useState<string>('settings');
    const prevNodeIdRef = useRef<string | null>(null);
    const currentNodeType = typeof node?.data?.type === 'string' ? node.data.type : undefined;

    useEffect(() => {
        if (!open) {
            prevNodeIdRef.current = null;
            return;
        }

        if (!node || prevNodeIdRef.current === node.id) {
            return;
        }

        prevNodeIdRef.current = node.id;
        formRef.current?.resetFields();
        formRef.current?.setFieldsValue(node.data);
    }, [node, open]);

    const handleValuesChange = (_: Record<string, unknown>, allValues: Record<string, unknown>) => {
        if (node) {
            onChange(node.id, allValues);
        }
    };

    return (
        <Drawer
            title={
                <Space>
                    {nodeTypeConfig[currentNodeType || '']?.label || '节点详情'}
                    {getStatusIcon(node?.data?.status)}
                </Space>
            }
            placement="right"
            onClose={onClose}
            open={open}
            size={activeTab === 'logs' ? LOGS_DRAWER_WIDTH : SETTINGS_DRAWER_WIDTH}
            mask={false}
            styles={{ body: DRAWER_BODY_STYLE }}
        >
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                <NodeDetailPanelSidebar
                    allEdges={allEdges}
                    allNodes={allNodes}
                    node={node}
                    onNodeSelect={onNodeSelect}
                />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', height: '100%' }}>
                    <Tabs
                        activeKey={activeTab}
                        onChange={setActiveTab}
                        style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
                        tabBarStyle={{ padding: '0 16px', margin: 0, flexShrink: 0 }}
                        items={[
                            {
                                key: 'settings',
                                label: <span><SettingOutlined /> 设置</span>,
                                children: (
                                    <div style={{ padding: 16, overflowY: 'auto', overflowX: 'hidden', height: SETTINGS_TAB_HEIGHT }}>
                                        {node && (
                                            <ProForm
                                                formRef={formRef}
                                                submitter={false}
                                                onValuesChange={handleValuesChange}
                                                layout="vertical"
                                            >
                                                <ProFormText name="label" label="节点名称" />
                                                <Divider style={{ margin: '12px 0' }}>
                                                    <Text type="secondary" style={{ fontSize: 12 }}>参数配置</Text>
                                                </Divider>
                                                <NodeDetailPanelSettings formRef={formRef} node={node} onChange={onChange} />
                                            </ProForm>
                                        )}
                                    </div>
                                )
                            },
                            {
                                key: 'logs',
                                label: <span><FileTextOutlined /> 日志</span>,
                                children: (
                                    <div style={{ height: LOGS_TAB_HEIGHT, overflow: 'auto', background: '#1e1e1e' }}>
                                        <NodeDetailPanelLogs node={node} onRetry={onRetry} />
                                    </div>
                                )
                            }
                        ]}
                    />
                </div>
            </div>
        </Drawer>
    );
};

export default NodeDetailPanel;
