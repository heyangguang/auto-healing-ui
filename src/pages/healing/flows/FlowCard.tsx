import React from 'react';
import {
  BranchesOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  PartitionOutlined,
} from '@ant-design/icons';
import {
  Button,
  Col,
  Popconfirm,
  Space,
  Switch,
  Tooltip,
} from 'antd';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';
import { FlowNodePreview, getFunctionalFlowNodes } from './FlowNodePreview';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

type FlowCardProps = {
  actionLoading: string | null;
  canDeleteFlow: boolean;
  canUpdateFlow: boolean;
  flow: AutoHealing.HealingFlow;
  onDelete: (event: React.MouseEvent<HTMLElement> | undefined, flow: AutoHealing.HealingFlow) => void;
  onEdit: (flowId: string) => void;
  onOpen: (flow: AutoHealing.HealingFlow) => void;
  onToggle: (flow: AutoHealing.HealingFlow, checked: boolean) => void;
};

export const FlowCard: React.FC<FlowCardProps> = ({
  actionLoading,
  canDeleteFlow,
  canUpdateFlow,
  flow,
  onDelete,
  onEdit,
  onOpen,
  onToggle,
}) => {
  const nodeCount = getFunctionalFlowNodes(flow.nodes || []).length;
  const edgeCount = (flow.edges || []).length;
  const cardClass = ['flow-card', flow.is_active ? 'flow-card-active' : 'flow-card-inactive']
    .filter(Boolean)
    .join(' ');

  return (
    <Col xs={24} sm={12} md={12} lg={8} xl={6} xxl={6}>
      <div className={cardClass} onClick={() => onOpen(flow)}>
        <div className="flow-card-body">
          <div className="flow-card-header">
            <div className="flow-card-title">{flow.name || '未命名流程'}</div>
            <Space size={4}>
              {flow.is_active ? (
                <span className="flow-card-status-active">
                  <CheckCircleOutlined /> 启用
                </span>
              ) : (
                <span className="flow-card-status-inactive">已停用</span>
              )}
            </Space>
          </div>

          <div className="flow-card-desc">{flow.description || '未添加描述'}</div>
          <FlowNodePreview nodes={flow.nodes || []} />

          <div className="flow-card-info-grid">
            <span className="flow-card-info-item">
              <PartitionOutlined />
              <span className="info-value">{nodeCount}</span> 节点
            </span>
            <span className="flow-card-info-item">
              <BranchesOutlined />
              <span className="info-value">{edgeCount}</span> 连线
            </span>
            <span className="flow-card-info-item">
              <ClockCircleOutlined />
              创建 {flow.created_at ? dayjs(flow.created_at).format('MM/DD') : '-'}
            </span>
            <span className="flow-card-info-item">
              <ClockCircleOutlined />
              更新 {flow.updated_at ? dayjs(flow.updated_at).fromNow() : '-'}
            </span>
          </div>

          <div className="flow-card-footer">
            <span className="flow-card-footer-left">ID: {flow.id?.substring(0, 8)}...</span>
            <Space size={0} onClick={(event) => event.stopPropagation()}>
              <Tooltip title={flow.is_active ? '停用' : '启用'}>
                <Switch
                  size="small"
                  checked={flow.is_active}
                  loading={actionLoading === flow.id}
                  onChange={(checked) => onToggle(flow, checked)}
                  disabled={!canUpdateFlow}
                />
              </Tooltip>
              <Button
                type="text"
                size="small"
                icon={<EditOutlined />}
                disabled={!canUpdateFlow}
                onClick={() => onEdit(flow.id)}
              />
              <Popconfirm
                title="确定删除此流程？"
                description="删除后无法恢复"
                onConfirm={(event) => onDelete(event, flow)}
              >
                <Button
                  type="text"
                  danger
                  size="small"
                  icon={<DeleteOutlined />}
                  loading={actionLoading === flow.id}
                  disabled={!canDeleteFlow}
                />
              </Popconfirm>
            </Space>
          </div>
        </div>
      </div>
    </Col>
  );
};
