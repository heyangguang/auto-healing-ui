import type { LogEntry } from '@/components/execution/LogConsole';
import type { Node } from 'reactflow';
import type { SelectedNodeDataLike } from './nodeDetailTypes';

type UseInstanceNodeSelectionOptions = {
    nodeLogs: Record<string, LogEntry[]>;
    setNodeDetailVisible: React.Dispatch<React.SetStateAction<boolean>>;
    setRuleDrawerVisible: React.Dispatch<React.SetStateAction<boolean>>;
    setSelectedNodeData: React.Dispatch<React.SetStateAction<SelectedNodeDataLike | null>>;
};

export const useInstanceNodeSelection = ({
    nodeLogs,
    setNodeDetailVisible,
    setRuleDrawerVisible,
    setSelectedNodeData,
}: UseInstanceNodeSelectionOptions) => {
    const handleNodeClick = (_: React.MouseEvent, node: Node) => {
        if (node.id === 'virtual-rule-trigger') {
            setRuleDrawerVisible(true);
            return;
        }

        const currentLogs = nodeLogs[node.id] || [];
        setSelectedNodeData({
            id: node.id,
            name: typeof node.data.label === 'string' ? node.data.label : undefined,
            type: typeof node.data.type === 'string' ? node.data.type : undefined,
            status: typeof node.data.status === 'string' ? node.data.status : undefined,
            config: node.data,
            state: node.data._nodeState,
            logs: currentLogs,
        });
        setNodeDetailVisible(true);
    };

    return handleNodeClick;
};
