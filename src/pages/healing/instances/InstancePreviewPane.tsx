import React from 'react';
import { Button, Empty, Space, Spin, Tag, Typography } from 'antd';
import { FullscreenOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { history } from '@umijs/max';
import ReactFlow, { Background, BackgroundVariant, Controls, type Edge, type Node, type OnEdgesChange, type OnNodesChange, type NodeTypes, type ProOptions } from 'reactflow';
import AutoLayoutButton from './components/AutoLayoutButton';

const { Text } = Typography;

type InstancePreviewPaneProps = {
  detailLoading: boolean;
  edges: Edge[];
  handleAutoLayout: () => void;
  instanceDetail: AutoHealing.FlowInstance | null;
  nodeTypes: NodeTypes;
  nodes: Node[];
  onEdgesChange: OnEdgesChange;
  onNodeClick: (_event: React.MouseEvent, node: Node) => void;
  onNodesChange: OnNodesChange;
  proOptions: ProOptions;
  selectedInstanceId?: string;
  selectedStatusConfig: { color: string; icon: React.ReactElement; label: string } | null;
};

export const InstancePreviewPane: React.FC<InstancePreviewPaneProps> = ({
  detailLoading,
  edges,
  handleAutoLayout,
  instanceDetail,
  nodeTypes,
  nodes,
  onEdgesChange,
  onNodeClick,
  onNodesChange,
  proOptions,
  selectedInstanceId,
  selectedStatusConfig,
}) => (
  <div style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column' }}>
    {instanceDetail && (
      <div style={{ padding: '12px 24px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Space>
          <Text strong>{instanceDetail.flow_name}</Text>
          {selectedStatusConfig && (
            <Tag color={selectedStatusConfig.color} style={{ border: 'none' }}>
              <Space size={4}>
                {selectedStatusConfig.icon}
                {selectedStatusConfig.label}
              </Space>
            </Tag>
          )}
        </Space>
        <Space>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {instanceDetail.incident && (
              <><ThunderboltOutlined style={{ color: '#faad14' }} /> {instanceDetail.rule?.name}</>
            )}
          </Text>
          <Button
            size="small"
            icon={<FullscreenOutlined />}
            onClick={() => history.push(`/healing/instances/${selectedInstanceId}`)}
          >
            详情
          </Button>
        </Space>
      </div>
    )}

    <div style={{ flex: 1, position: 'relative' }}>
      {detailLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <Spin size="large" />
        </div>
      ) : !instanceDetail ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <Empty description="选择左侧实例查看画布" />
        </div>
      ) : (
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          proOptions={proOptions}
          fitView
          fitViewOptions={{ padding: 0.3, maxZoom: 0.8 }}
          attributionPosition="bottom-right"
        >
          <Background variant={BackgroundVariant.Dots} color="#bfbfbf" gap={20} size={1.5} />
          <Controls />
          <AutoLayoutButton onAutoLayout={handleAutoLayout} />
        </ReactFlow>
      )}
    </div>
  </div>
);
