import type { NodeTypes } from 'reactflow';
import ApprovalNode from './ApprovalNode';
import ConditionNode from './ConditionNode';
import CustomNode from './CustomNode';
import EndNode from './EndNode';
import ExecutionNode from './ExecutionNode';
import StartNode from './StartNode';

export const DEFAULT_FLOW_NAME = '新建自愈流程';
export const DEFAULT_START_NODE_ID = 'start_1';
export const DEFAULT_END_NODE_ID = 'end_1';

export const flowEditorNodeTypes: NodeTypes = {
    approval: ApprovalNode,
    compute: CustomNode,
    condition: ConditionNode,
    custom: CustomNode,
    end: EndNode,
    execution: ExecutionNode,
    start: StartNode,
};

export function createNodeId() {
    return `node_${Math.random().toString(36).slice(2, 11)}`;
}

export function getReactFlowNodeType(type: string) {
    switch (type) {
        case 'approval':
        case 'compute':
        case 'condition':
        case 'end':
        case 'execution':
        case 'start':
            return type;
        default:
            return 'custom';
    }
}
