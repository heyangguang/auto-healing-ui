import React from 'react';
import { Tooltip, Typography } from 'antd';
import { FLOW_NODE_VISUALS, getFlowNodeIcon } from './flowNodeVisuals';

const { Text } = Typography;

export function getFunctionalFlowNodes(nodes: AutoHealing.FlowNode[] = []) {
  return nodes.filter((node) => node.type !== 'start' && node.type !== 'end');
}

export function getFlowNodeTypeSummary(nodes: AutoHealing.FlowNode[] = []) {
  const counts: Record<string, number> = {};

  for (const node of getFunctionalFlowNodes(nodes)) {
    counts[node.type] = (counts[node.type] || 0) + 1;
  }

  return counts;
}

type FlowNodePreviewProps = {
  nodes?: AutoHealing.FlowNode[];
};

export const FlowNodePreview: React.FC<FlowNodePreviewProps> = ({ nodes = [] }) => {
  const functionalNodes = getFunctionalFlowNodes(nodes);
  const previewNodes = functionalNodes.length > 5
    ? [...functionalNodes.slice(0, 3), ...functionalNodes.slice(-1)]
    : functionalNodes;
  const hiddenCount = functionalNodes.length > 5 ? functionalNodes.length - 4 : 0;

  if (functionalNodes.length === 0) {
    return <Text type="secondary" style={{ fontSize: 11 }}>暂无节点</Text>;
  }

  return (
    <div className="flow-card-node-preview">
      {previewNodes.map((node, index) => (
        <React.Fragment key={`${node.id}-${index}`}>
          <Tooltip title={`${FLOW_NODE_VISUALS[node.type]?.label || node.type}: ${node.name || node.config?.label || ''}`}>
            <div className="flow-card-node-icon">
              {getFlowNodeIcon(node.type)}
            </div>
          </Tooltip>
          {index === 2 && hiddenCount > 0 && (
            <span className="flow-card-node-more">+{hiddenCount}</span>
          )}
          {index < previewNodes.length - 1 && index !== 2 && (
            <div className="flow-card-node-connector" />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};
