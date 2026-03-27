import React from 'react';
import {
  AuditOutlined,
  BellOutlined,
  BranchesOutlined,
  CloudServerOutlined,
  CodeOutlined,
  FunctionOutlined,
  SafetyCertificateOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { NODE_TYPE_COLORS, NODE_TYPE_LABELS as rawNodeLabels } from '../nodeConfig';

export type FlowNodeVisual = {
  color: string;
  label: string;
};

export const FLOW_NODE_VISUALS: Record<string, FlowNodeVisual> = Object.fromEntries(
  Object.entries(rawNodeLabels)
    .filter(([key]) => key !== 'start' && key !== 'end')
    .map(([key, label]) => [key, { label, color: NODE_TYPE_COLORS[key] || '#8c8c8c' }]),
);

export function getFlowNodeIcon(type: string) {
  const style = { fontSize: 13 };
  const color = FLOW_NODE_VISUALS[type]?.color || '#595959';

  switch (type) {
    case 'execution':
      return <CodeOutlined style={{ ...style, color }} />;
    case 'approval':
      return <AuditOutlined style={{ ...style, color }} />;
    case 'notification':
      return <BellOutlined style={{ ...style, color }} />;
    case 'host_extractor':
      return <CloudServerOutlined style={{ ...style, color }} />;
    case 'cmdb_validator':
      return <SafetyCertificateOutlined style={{ ...style, color }} />;
    case 'condition':
      return <BranchesOutlined style={{ ...style, color }} />;
    case 'set_variable':
      return <SettingOutlined style={{ ...style, color }} />;
    default:
      return <FunctionOutlined style={{ ...style, color }} />;
  }
}
