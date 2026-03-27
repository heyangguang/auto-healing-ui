import type { MutableRefObject } from 'react';
import type { ProFormInstance } from '@ant-design/pro-form';
import type { FlowEditorNode } from './flowEditorTypes';

export type NodeConfigFormValues = Record<string, unknown>;
export type NodeConfigFormRef = MutableRefObject<ProFormInstance<NodeConfigFormValues> | undefined>;
export type NodeConfigPanelChangeHandler = (nodeId: string, values: NodeConfigFormValues) => void;

export interface NodeConfigPanelProps {
    node: FlowEditorNode | null;
    open: boolean;
    onClose: () => void;
    onChange: NodeConfigPanelChangeHandler;
}

export interface ChannelInfo {
    id: string;
    name: string;
    type: string;
}

export interface NodeConfigSectionProps {
    formRef: NodeConfigFormRef;
    node: FlowEditorNode;
    onChange: NodeConfigPanelChangeHandler;
}

export interface NodeConfigExecutionSectionProps extends NodeConfigSectionProps {
    selectedTaskName: string;
    taskSelectorOpen: boolean;
    onSelectedTaskNameChange: (name: string) => void;
    onTaskSelectorOpenChange: (open: boolean) => void;
}

export interface NodeConfigNotificationSectionProps extends NodeConfigSectionProps {
    channelList: ChannelInfo[];
    selectedChannelTypes: string[];
    onChannelListChange: (channels: ChannelInfo[]) => void;
    onSelectedChannelTypesChange: (types: string[]) => void;
}
