import React from 'react';
import { Alert } from 'antd';
import { NodeConfigExecutionSection } from './NodeConfigPanelExecutionSection';
import { NodeConfigNotificationSection } from './NodeConfigPanelNotificationSection';
import {
    ApprovalNodeSection,
    CmdbValidatorSection,
    ComputeNodeSection,
    ConditionNodeSection,
    EndNodeSection,
    HostExtractorSection,
    SetVariableNodeSection,
    StartNodeSection,
} from './NodeConfigPanelCommonSections';
import type { ChannelInfo, NodeConfigFormRef, NodeConfigPanelChangeHandler } from './nodeConfigPanelTypes';
import type { FlowEditorNode } from './flowEditorTypes';

interface NodeConfigPanelContentProps {
    channelList: ChannelInfo[];
    formRef: NodeConfigFormRef;
    node: FlowEditorNode | null;
    onChange: NodeConfigPanelChangeHandler;
    onChannelListChange: (channels: ChannelInfo[]) => void;
    onSelectedChannelTypesChange: (types: string[]) => void;
    onSelectedTaskNameChange: (name: string) => void;
    onTaskSelectorOpenChange: (open: boolean) => void;
    selectedChannelTypes: string[];
    selectedTaskName: string;
    taskSelectorOpen: boolean;
}

export const NodeConfigPanelContent: React.FC<NodeConfigPanelContentProps> = ({
    channelList,
    formRef,
    node,
    onChange,
    onChannelListChange,
    onSelectedChannelTypesChange,
    onSelectedTaskNameChange,
    onTaskSelectorOpenChange,
    selectedChannelTypes,
    selectedTaskName,
    taskSelectorOpen,
}) => {
    if (!node) {
        return null;
    }

    const nodeType = typeof node.data?.type === 'string' ? node.data.type : node.type;
    const sharedProps = { formRef, node, onChange };

    switch (nodeType) {
        case 'start': return <StartNodeSection />;
        case 'end': return <EndNodeSection />;
        case 'host_extractor': return <HostExtractorSection formRef={formRef} />;
        case 'cmdb_validator': return <CmdbValidatorSection />;
        case 'approval': return <ApprovalNodeSection />;
        case 'execution': return <NodeConfigExecutionSection {...sharedProps} onSelectedTaskNameChange={onSelectedTaskNameChange} onTaskSelectorOpenChange={onTaskSelectorOpenChange} selectedTaskName={selectedTaskName} taskSelectorOpen={taskSelectorOpen} />;
        case 'notification': return <NodeConfigNotificationSection {...sharedProps} channelList={channelList} onChannelListChange={onChannelListChange} onSelectedChannelTypesChange={onSelectedChannelTypesChange} selectedChannelTypes={selectedChannelTypes} />;
        case 'condition': return <ConditionNodeSection />;
        case 'set_variable': return <SetVariableNodeSection />;
        case 'compute': return <ComputeNodeSection {...sharedProps} />;
        default: return <Alert message={`未知的节点类型: ${nodeType}`} type="error" />;
    }
};
