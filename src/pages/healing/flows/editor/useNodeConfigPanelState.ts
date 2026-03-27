import { useEffect, useRef, useState } from 'react';
import type { ProFormInstance } from '@ant-design/pro-form';
import { getSelectedChannelTypes } from './NodeConfigPanelShared';
import type { ChannelInfo, NodeConfigFormValues, NodeConfigPanelProps } from './nodeConfigPanelTypes';

type UseNodeConfigPanelStateArgs = Pick<NodeConfigPanelProps, 'node' | 'open' | 'onChange'>;

export function useNodeConfigPanelState({ node, open, onChange }: UseNodeConfigPanelStateArgs) {
    const formRef = useRef<ProFormInstance<NodeConfigFormValues> | undefined>(undefined);
    const prevNodeIdRef = useRef<string | null>(null);
    const [channelList, setChannelList] = useState<ChannelInfo[]>([]);
    const [selectedChannelTypes, setSelectedChannelTypes] = useState<string[]>([]);
    const [taskSelectorOpen, setTaskSelectorOpen] = useState(false);
    const [selectedTaskName, setSelectedTaskName] = useState('');

    useEffect(() => {
        if (node && open && prevNodeIdRef.current !== node.id) {
            prevNodeIdRef.current = node.id;
            setSelectedChannelTypes([]);
            formRef.current?.resetFields();
            formRef.current?.setFieldsValue(node.data);
        }

        if (node && open) {
            const taskName = typeof node.data?.task_template_name === 'string' ? node.data.task_template_name : '';
            setSelectedTaskName(taskName);
        }

        if (!open) {
            prevNodeIdRef.current = null;
            setSelectedChannelTypes([]);
        }
    }, [node, open]);

    useEffect(() => {
        if (!node || !open) {
            return;
        }

        setSelectedChannelTypes(getSelectedChannelTypes(node.data?.channel_ids, channelList));
    }, [channelList, node, open]);

    const handleValuesChange = (_: NodeConfigFormValues, allValues: NodeConfigFormValues) => {
        if (!node) {
            return;
        }

        onChange(node.id, allValues);
    };

    return {
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
    };
}
