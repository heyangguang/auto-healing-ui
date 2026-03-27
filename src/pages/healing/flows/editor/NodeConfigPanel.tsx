import React from 'react';
import { Drawer, Divider, Typography } from 'antd';
import { ProForm, ProFormText } from '@ant-design/pro-components';
import { NodeConfigPanelContent } from './NodeConfigPanelContent';
import { NodeConfigPanelTitle, RunResultView } from './NodeConfigPanelShared';
import { useNodeConfigPanelState } from './useNodeConfigPanelState';
import type { NodeConfigPanelProps } from './nodeConfigPanelTypes';

const NodeConfigPanel: React.FC<NodeConfigPanelProps> = ({ node, open, onClose, onChange }) => {
    const {
        channelList,
        formRef,
        handleValuesChange,
        selectedChannelTypes,
        selectedTaskName,
        setChannelList,
        setSelectedChannelTypes,
        setSelectedTaskName,
        setTaskSelectorOpen,
        taskSelectorOpen,
    } = useNodeConfigPanelState({ node, open, onChange });

    return (
        <Drawer
            title={<NodeConfigPanelTitle node={node} />}
            size={820}
            onClose={onClose}
            open={open}
            mask={false}
            style={{ top: 64 }}
            styles={{ body: { paddingBottom: 80 } }}
            maskClosable={false}
        >
            {node && (
                <>
                    <RunResultView data={node.data} />
                    <ProForm formRef={formRef} submitter={false} onValuesChange={handleValuesChange} layout="vertical">
                        <ProFormText name="label" label="节点名称" />
                        <Divider style={{ margin: '12px 0' }}>
                            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                                参数配置
                            </Typography.Text>
                        </Divider>
                        <NodeConfigPanelContent
                            channelList={channelList}
                            formRef={formRef}
                            node={node}
                            onChange={onChange}
                            onChannelListChange={setChannelList}
                            onSelectedChannelTypesChange={setSelectedChannelTypes}
                            onSelectedTaskNameChange={setSelectedTaskName}
                            onTaskSelectorOpenChange={setTaskSelectorOpen}
                            selectedChannelTypes={selectedChannelTypes}
                            selectedTaskName={selectedTaskName}
                            taskSelectorOpen={taskSelectorOpen}
                        />
                    </ProForm>
                </>
            )}
        </Drawer>
    );
};

export default NodeConfigPanel;
