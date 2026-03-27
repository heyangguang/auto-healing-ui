import React from 'react';
import {
  BranchesOutlined,
  DeploymentUnitOutlined,
  EditOutlined,
  PartitionOutlined,
} from '@ant-design/icons';
import { Badge, Button, Drawer, Space, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import { FlowNodeDetails } from './FlowNodeDetails';
import { getFunctionalFlowNodes, getFlowNodeTypeSummary } from './FlowNodePreview';
import { FLOW_NODE_VISUALS, getFlowNodeIcon } from './flowNodeVisuals';

const { Text } = Typography;

type FlowDetailDrawerProps = {
  canUpdateFlow: boolean;
  flow: AutoHealing.HealingFlow | null;
  onClose: () => void;
  onEdit: (flowId: string) => void;
  open: boolean;
  onOpenExecutionTemplate: (taskTemplateId: string) => void;
  onOpenNotificationTemplates: () => void;
};

const DetailRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="flow-detail-row">
    <span className="flow-detail-label">{label}</span>
    <span className="flow-detail-value">{value}</span>
  </div>
);

export const FlowDetailDrawer: React.FC<FlowDetailDrawerProps> = ({
  canUpdateFlow,
  flow,
  onClose,
  onEdit,
  onOpenExecutionTemplate,
  onOpenNotificationTemplates,
  open,
}) => {
  if (!flow) {
    return null;
  }

  const nodeTypeSummary = getFlowNodeTypeSummary(flow.nodes || []);
  const functionalNodes = getFunctionalFlowNodes(flow.nodes || []);

  return (
    <Drawer
      title={(
        <Space>
          <DeploymentUnitOutlined />
          {flow.name}
          {flow.is_active
            ? <Badge status="processing" text={<Text style={{ fontSize: 12 }}>运行中</Text>} />
            : <Tag>已停用</Tag>}
        </Space>
      )}
      size={600}
      open={open}
      onClose={onClose}
      destroyOnHidden
      extra={(
        <Button
          icon={<EditOutlined />}
          disabled={!canUpdateFlow}
          onClick={() => onEdit(flow.id)}
        >
          编辑
        </Button>
      )}
    >
      <div className="flow-detail-card">
        <h4><DeploymentUnitOutlined />基础信息</h4>
        <DetailRow label="流程名称" value={flow.name} />
        <DetailRow label="描述" value={flow.description || '-'} />
        <DetailRow label="状态" value={flow.is_active ? <Badge status="success" text="启用" /> : <Badge status="default" text="停用" />} />
        <DetailRow label="节点总数" value={(flow.nodes || []).length} />
        <DetailRow label="连线总数" value={(flow.edges || []).length} />
        <DetailRow label="创建时间" value={dayjs(flow.created_at).format('YYYY-MM-DD HH:mm:ss')} />
        {flow.updated_at && <DetailRow label="更新时间" value={dayjs(flow.updated_at).format('YYYY-MM-DD HH:mm:ss')} />}
      </div>

      <div className="flow-detail-card">
        <h4><PartitionOutlined />节点类型概要</h4>
        {Object.keys(nodeTypeSummary).length === 0 ? (
          <Text type="secondary" style={{ fontSize: 12 }}>无功能节点</Text>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {Object.entries(nodeTypeSummary).map(([type, count]) => (
              <Tag key={type} icon={getFlowNodeIcon(type)} style={{ margin: 0 }}>
                {FLOW_NODE_VISUALS[type]?.label || type} × {count}
              </Tag>
            ))}
          </div>
        )}
      </div>

      <div className="flow-detail-card">
        <h4><BranchesOutlined />节点详情 ({functionalNodes.length})</h4>
        <FlowNodeDetails
          nodes={functionalNodes}
          onEditExecutionTemplate={onOpenExecutionTemplate}
          onOpenNotificationTemplates={onOpenNotificationTemplates}
        />
      </div>
    </Drawer>
  );
};
