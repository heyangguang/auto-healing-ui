import React from 'react';
import { Tag, Typography } from 'antd';
import { getExecutorConfig } from '@/constants/executionDicts';
import { FLOW_NODE_VISUALS, getFlowNodeIcon } from './flowNodeVisuals';

const { Text } = Typography;

type FlowNodeConfigLike = AutoHealing.FlowNodeConfig & {
  approver_roles?: string[];
  approvers?: string[];
  channel_ids?: string[];
  channel_names?: Record<string, string>;
  condition?: string;
  description?: string;
  executor_type?: string;
  extra_vars?: Record<string, unknown>;
  false_target?: string;
  hosts_key?: string;
  input_key?: string;
  key?: string;
  operations?: Array<{ expression?: string; output_key?: string }>;
  output_key?: string;
  source_field?: string;
  split_by?: string;
  task_template_id?: string;
  task_template_name?: string;
  template_id?: string;
  template_name?: string;
  timeout_hours?: number;
  title?: string;
  true_target?: string;
  value?: unknown;
  variable_mappings?: Record<string, string>;
};

type FlowNodeDetailsProps = {
  nodes: AutoHealing.FlowNode[];
  onEditExecutionTemplate: (taskTemplateId: string) => void;
  onOpenNotificationTemplates: () => void;
};

const DetailRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="flow-node-detail-row">
    <span className="flow-node-detail-label">{label}</span>
    <span className="flow-node-detail-val">{value}</span>
  </div>
);

function renderExecutionDetails(config: FlowNodeConfigLike, onEditExecutionTemplate: (taskTemplateId: string) => void) {
  const taskTemplateId = config.task_template_id;
  const executor = config.executor_type ? getExecutorConfig(config.executor_type) : null;
  if (!taskTemplateId) {
    return <DetailRow label="任务模板" value={<span style={{ color: '#faad14', fontSize: 11 }}>⚠ 未配置</span>} />;
  }

  return (
    <>
      <DetailRow
        label="任务模板"
        value={config.task_template_name ? (
          <a onClick={(event) => { event.stopPropagation(); onEditExecutionTemplate(taskTemplateId); }} style={{ cursor: 'pointer' }}>
            {config.task_template_name}
          </a>
        ) : (
          <Tag color="error" style={{ margin: 0, fontSize: 10 }}>已删除</Tag>
        )}
      />
      {executor && <DetailRow label="执行器类型" value={executor.label} />}
      {config.hosts_key && <DetailRow label="主机变量" value={<code>{config.hosts_key}</code>} />}
      {config.extra_vars && Object.keys(config.extra_vars).length > 0 && (
        <DetailRow
          label="额外参数"
          value={Object.entries(config.extra_vars).map(([key, value]) => (
            <Tag key={key} style={{ margin: '0 4px 2px 0', fontSize: 10 }}>{key}={String(value)}</Tag>
          ))}
        />
      )}
      {config.variable_mappings && Object.keys(config.variable_mappings).length > 0 && (
        <DetailRow
          label="变量映射"
          value={Object.entries(config.variable_mappings).map(([key, value]) => (
            <span key={key} style={{ display: 'block', fontSize: 11 }}>
              <code>{key}</code> ← <code>{String(value)}</code>
            </span>
          ))}
        />
      )}
    </>
  );
}

function renderApprovalDetails(config: FlowNodeConfigLike) {
  return (
    <>
      {config.title && <DetailRow label="审批标题" value={config.title} />}
      {config.description && <DetailRow label="描述" value={config.description} />}
      {config.approvers && config.approvers.length > 0 && (
        <DetailRow
          label="审批人"
          value={config.approvers.map((approver) => (
            <Tag key={approver} style={{ margin: '0 4px 2px 0', fontSize: 10 }}>{approver}</Tag>
          ))}
        />
      )}
      {config.approver_roles && config.approver_roles.length > 0 && (
        <DetailRow
          label="审批角色"
          value={config.approver_roles.map((role) => (
            <Tag key={role} color="blue" style={{ margin: '0 4px 2px 0', fontSize: 10 }}>{role}</Tag>
          ))}
        />
      )}
      <DetailRow label="超时时间" value={`${config.timeout_hours || 24} 小时`} />
    </>
  );
}

function renderNotificationDetails(config: FlowNodeConfigLike, onOpenNotificationTemplates: () => void) {
  return (
    <>
      {config.template_id && (
        <DetailRow
          label="通知模板"
          value={config.template_name ? (
            <a onClick={(event) => { event.stopPropagation(); onOpenNotificationTemplates(); }} style={{ cursor: 'pointer' }}>
              {config.template_name}
            </a>
          ) : (
            <Tag color="error" style={{ margin: 0, fontSize: 10 }}>已删除</Tag>
          )}
        />
      )}
      {config.channel_ids && config.channel_ids.length > 0 && (
        <DetailRow
          label="通知渠道"
          value={config.channel_ids.map((channelId) => (
            <Tag key={channelId} color={config.channel_names?.[channelId] ? undefined : 'error'} style={{ margin: '0 4px 2px 0', fontSize: 10 }}>
              {config.channel_names?.[channelId] || '已删除'}
            </Tag>
          ))}
        />
      )}
      {!config.template_id && !config.channel_ids && (
        <DetailRow label="配置状态" value={<span style={{ color: '#faad14', fontSize: 11 }}>⚠ 未配置通知模板和通道</span>} />
      )}
    </>
  );
}

function renderSimpleDetails(config: FlowNodeConfigLike, type: string) {
  if (type === 'condition') {
    return (
      <>
        {config.condition && <DetailRow label="表达式" value={<code>{config.condition}</code>} />}
        {config.true_target && <DetailRow label="✓ 分支" value={<code>{config.true_target}</code>} />}
        {config.false_target && <DetailRow label="✗ 分支" value={<code>{config.false_target}</code>} />}
      </>
    );
  }

  if (type === 'host_extractor') {
    return (
      <>
        <DetailRow label="源字段" value={<code>{config.source_field || '-'}</code>} />
        <DetailRow label="提取模式" value={config.extract_mode === 'regex' ? '正则表达式' : '分隔符拆分'} />
        {config.split_by && <DetailRow label="分隔符" value={<code>{config.split_by}</code>} />}
        {config.output_key && <DetailRow label="输出变量" value={<code>{config.output_key}</code>} />}
      </>
    );
  }

  if (type === 'cmdb_validator') {
    return config.input_key ? <DetailRow label="输入变量" value={<code>{config.input_key}</code>} /> : null;
  }

  if (type === 'compute') {
    return config.operations && config.operations.length > 0 ? (
      <DetailRow
        label="运算"
        value={config.operations.map((operation, index) => (
          <span key={`${operation.output_key || 'op'}-${index}`} style={{ display: 'block', fontSize: 11 }}>
            <code>{operation.output_key}</code> = <code>{operation.expression}</code>
          </span>
        ))}
      />
    ) : null;
  }

  if (type === 'set_variable') {
    return (
      <>
        {config.key && <DetailRow label="变量名" value={<code>{config.key}</code>} />}
        {config.value !== undefined && (
          <DetailRow
            label="值"
            value={<code>{typeof config.value === 'object' ? JSON.stringify(config.value) : String(config.value)}</code>}
          />
        )}
      </>
    );
  }

  return null;
}

function renderNodeSpecificDetails(
  node: AutoHealing.FlowNode,
  config: FlowNodeConfigLike,
  onEditExecutionTemplate: (taskTemplateId: string) => void,
  onOpenNotificationTemplates: () => void,
) {
  switch (node.type) {
    case 'execution':
      return renderExecutionDetails(config, onEditExecutionTemplate);
    case 'approval':
      return renderApprovalDetails(config);
    case 'notification':
      return renderNotificationDetails(config, onOpenNotificationTemplates);
    default:
      return renderSimpleDetails(config, node.type);
  }
}

export const FlowNodeDetails: React.FC<FlowNodeDetailsProps> = ({
  nodes,
  onEditExecutionTemplate,
  onOpenNotificationTemplates,
}) => {
  if (nodes.length === 0) {
    return <Text type="secondary" style={{ fontSize: 12 }}>暂无功能节点</Text>;
  }

  return (
    <div className="flow-detail-node-list">
      {nodes.map((node) => {
        const config = (node.config || {}) as FlowNodeConfigLike;
        const typeInfo = FLOW_NODE_VISUALS[node.type];

        return (
          <div key={node.id} className="flow-node-detail-card">
            <div className="flow-node-detail-header">
              <span className="flow-node-detail-icon" style={{ color: typeInfo?.color || '#8c8c8c' }}>
                {getFlowNodeIcon(node.type)}
              </span>
              <div className="flow-node-detail-title">
                <span className="flow-node-detail-name">{node.name || String(config.label || node.id)}</span>
                <Tag color={typeInfo?.color} style={{ margin: 0, fontSize: 10 }}>
                  {typeInfo?.label || node.type}
                </Tag>
              </div>
            </div>
            <div className="flow-node-detail-content">
              {renderNodeSpecificDetails(node, config, onEditExecutionTemplate, onOpenNotificationTemplates)}
            </div>
          </div>
        );
      })}
    </div>
  );
};
