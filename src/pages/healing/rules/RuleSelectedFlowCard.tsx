import React from 'react';
import { BranchesOutlined, CheckCircleOutlined, CloseCircleOutlined, NodeIndexOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Space, Tag, Typography } from 'antd';

const { Text } = Typography;

type NodeTypeMeta = {
  color: string;
  icon: React.ReactNode;
  label: string;
};

type RuleSelectedFlowCardProps = {
  nodeTypeMeta: Record<string, NodeTypeMeta>;
  onClear: () => void;
  onOpenSelector: () => void;
  selectedFlow: AutoHealing.HealingFlow | null;
};

export const RuleSelectedFlowCard: React.FC<RuleSelectedFlowCardProps> = ({
  nodeTypeMeta,
  onClear,
  onOpenSelector,
  selectedFlow,
}) => {
  if (!selectedFlow) {
    return (
      <Button
        type="dashed"
        icon={<PlusOutlined />}
        style={{ width: '100%', height: 56 }}
        onClick={onOpenSelector}
      >
        点击选择自愈流程
      </Button>
    );
  }

  const activeNodeCount = (selectedFlow.nodes || []).filter((node) => node.type !== 'start' && node.type !== 'end').length;
  const nodeTypeCounts = Object.entries(
    (selectedFlow.nodes || []).reduce((accumulator, node) => {
      if (node.type !== 'start' && node.type !== 'end') {
        accumulator[node.type] = (accumulator[node.type] || 0) + 1;
      }
      return accumulator;
    }, {} as Record<string, number>),
  );

  return (
    <div className="rule-form-selected-flow">
      <div className="rule-form-selected-flow-main">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <BranchesOutlined style={{ color: '#1890ff' }} />
          <Text strong style={{ fontSize: 14 }}>{selectedFlow.name}</Text>
          {selectedFlow.is_active ? (
            <Tag icon={<CheckCircleOutlined />} color="success" style={{ margin: 0, fontSize: 10 }}>启用</Tag>
          ) : (
            <Tag color="default" style={{ margin: 0, fontSize: 10 }}>已停用</Tag>
          )}
        </div>
        {selectedFlow.description && (
          <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
            {selectedFlow.description}
          </Text>
        )}
        <Space size={4} wrap>
          {activeNodeCount > 0 ? (
            nodeTypeCounts.map(([type, count]) => {
              const meta = nodeTypeMeta[type] || {
                label: type,
                icon: <NodeIndexOutlined />,
                color: '#8c8c8c',
              };

              return (
                <Tag
                  key={type}
                  icon={meta.icon}
                  style={{
                    fontSize: 10,
                    lineHeight: '16px',
                    padding: '0 4px',
                    margin: 0,
                    color: meta.color,
                    borderColor: meta.color,
                    background: 'transparent',
                  }}
                >
                  {meta.label}×{count}
                </Tag>
              );
            })
          ) : (
            <Tag style={{ fontSize: 10, margin: 0, color: '#bfbfbf' }}>空流程</Tag>
          )}
          <Text type="secondary" style={{ fontSize: 10 }}>
            ({activeNodeCount}节点 · {(selectedFlow.edges || []).length}连线)
          </Text>
        </Space>
      </div>
      <Space size={4}>
        <Button type="link" size="small" onClick={onOpenSelector}>
          更换
        </Button>
        <Button
          type="link"
          danger
          size="small"
          icon={<CloseCircleOutlined />}
          onClick={onClear}
        >
          清除
        </Button>
      </Space>
    </div>
  );
};
