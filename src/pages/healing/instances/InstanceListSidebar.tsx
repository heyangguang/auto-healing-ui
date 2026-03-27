import React from 'react';
import { BranchesOutlined, ClockCircleOutlined, CloseCircleOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { Empty, Space, Spin, Tag, Tooltip, Typography } from 'antd';
import dayjs from 'dayjs';
import { formatInstanceDuration, getInstanceStatusConfig, hasFailedNodes, hasRejectedNodes } from './instanceStatus';

const { Text } = Typography;

type InstanceListSidebarProps = {
  hasMore: boolean;
  instances: AutoHealing.FlowInstance[];
  loading: boolean;
  onScroll: (event: React.UIEvent<HTMLDivElement>) => void;
  onSelect: (instanceId: string) => void;
  selectedInstanceId?: string;
};

export const InstanceListSidebar: React.FC<InstanceListSidebarProps> = ({
  hasMore,
  instances,
  loading,
  onScroll,
  onSelect,
  selectedInstanceId,
}) => (
  <div
    style={{
      width: '20%',
      minWidth: 280,
      maxWidth: 360,
      height: '100%',
      borderRight: '1px solid #f0f0f0',
      display: 'flex',
      flexDirection: 'column',
    }}
  >
    <div style={{ flex: 1, overflowY: 'auto' }} onScroll={onScroll}>
      {instances.length === 0 && !loading ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无实例" style={{ marginTop: 60 }} />
      ) : (
        instances.map((item) => {
          const statusConfig = getInstanceStatusConfig(item.status);
          const isSelected = item.id === selectedInstanceId;
          const isFailed = hasFailedNodes(item);
          const isRejected = hasRejectedNodes(item);
          const nodeCount = item.node_count ?? 0;
          const failedCount = item.failed_node_count ?? 0;
          const rejectedCount = item.rejected_node_count ?? 0;

          return (
            <div
              key={item.id}
              onClick={() => onSelect(item.id)}
              style={{
                padding: '8px 10px 8px 14px',
                borderBottom: '1px solid #f0f0f0',
                cursor: 'pointer',
                position: 'relative',
                background: isSelected ? '#e6f7ff' : '#fff',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(event) => {
                if (!isSelected) {
                  event.currentTarget.style.background = '#fafafa';
                }
              }}
              onMouseLeave={(event) => {
                if (!isSelected) {
                  event.currentTarget.style.background = '#fff';
                }
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: 3,
                  background: isRejected ? '#ff4d4f' : (isFailed ? '#fa8c16' : statusConfig.color),
                }}
              />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text strong style={{ fontSize: 12, flex: 1, minWidth: 0 }} ellipsis>
                  {item.flow_name || '未知流程'}
                </Text>
                <Space size={4} style={{ flexShrink: 0 }}>
                  {isRejected && (
                    <Tag color="error" style={{ margin: 0, border: 'none', fontSize: 10, lineHeight: '18px', padding: '0 4px' }}>
                      审批拒绝
                    </Tag>
                  )}
                  {isFailed && (
                    <Tag color="warning" style={{ margin: 0, border: 'none', fontSize: 10, lineHeight: '18px', padding: '0 4px' }}>
                      包含失败
                    </Tag>
                  )}
                  <Tag color={statusConfig.color} style={{ margin: 0, border: 'none', fontSize: 10, lineHeight: '18px', padding: '0 6px' }}>
                    {statusConfig.icon} {statusConfig.label}
                  </Tag>
                </Space>
              </div>

              {(item.rule_name || item.rule?.name || item.incident_title || item.incident?.title) && (
                <div style={{ fontSize: 11, color: '#595959', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                  {(item.rule_name || item.rule?.name) && (
                    <Tooltip title={`规则: ${item.rule_name || item.rule?.name}`}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, maxWidth: '50%' }}>
                        <ThunderboltOutlined style={{ color: '#722ed1', fontSize: 10 }} />
                        <Text style={{ fontSize: 11, color: '#595959' }} ellipsis>{item.rule_name || item.rule?.name}</Text>
                      </span>
                    </Tooltip>
                  )}
                  {(item.rule_name || item.rule?.name) && (item.incident_title || item.incident?.title) && <span style={{ color: '#d9d9d9' }}>·</span>}
                  {(item.incident_title || item.incident?.title) && (
                    <Tooltip title={item.incident_title || item.incident?.title}>
                      <Text style={{ fontSize: 11, color: '#8c8c8c', flex: 1 }} ellipsis>
                        {item.incident_title || item.incident?.title}
                      </Text>
                    </Tooltip>
                  )}
                </div>
              )}

              <div style={{ fontSize: 11, color: '#8c8c8c', marginTop: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Space size={6}>
                  <span><ClockCircleOutlined style={{ fontSize: 10 }} /> {dayjs(item.started_at).format('MM-DD HH:mm')}</span>
                  <span>{formatInstanceDuration(item.started_at || undefined, item.completed_at || undefined)}</span>
                </Space>
                <Space size={6}>
                  {nodeCount > 0 && (
                    <span><BranchesOutlined style={{ fontSize: 10 }} /> {nodeCount}节点</span>
                  )}
                  {failedCount > 0 && (
                    <span style={{ color: '#fa8c16' }}><CloseCircleOutlined style={{ fontSize: 10 }} /> {failedCount}失败</span>
                  )}
                  {rejectedCount > 0 && (
                    <span style={{ color: '#ff4d4f' }}><CloseCircleOutlined style={{ fontSize: 10 }} /> {rejectedCount}拒绝</span>
                  )}
                </Space>
              </div>

              {item.error_message && (
                <div style={{ fontSize: 11, color: '#ff4d4f', marginTop: 2, background: '#fff2f0', padding: '1px 6px', borderRadius: 3 }}>
                  <Text style={{ fontSize: 11, color: '#ff4d4f' }} ellipsis>{item.error_message}</Text>
                </div>
              )}
            </div>
          );
        })
      )}
      {loading && hasMore && (
        <div style={{ textAlign: 'center', padding: '12px 0', color: '#999' }}>
          <Space><Spin size="small" /> 加载中...</Space>
        </div>
      )}
    </div>
  </div>
);
