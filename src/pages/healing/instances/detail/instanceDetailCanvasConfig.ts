import type { ProOptions } from 'reactflow';
import ApprovalNode from '../../flows/editor/ApprovalNode';
import ConditionNode from '../../flows/editor/ConditionNode';
import CustomNode from '../../flows/editor/CustomNode';
import EndNode from '../../flows/editor/EndNode';
import ExecutionNode from '../../flows/editor/ExecutionNode';
import StartNode from '../../flows/editor/StartNode';

export const instanceDetailNodeTypes = {
    start: StartNode,
    end: EndNode,
    host_extractor: CustomNode,
    cmdb_validator: CustomNode,
    approval: ApprovalNode,
    execution: ExecutionNode,
    notification: CustomNode,
    condition: ConditionNode,
    set_variable: CustomNode,
    compute: CustomNode,
    custom: CustomNode,
};

export const instanceDetailProOptions: ProOptions = { hideAttribution: true };
