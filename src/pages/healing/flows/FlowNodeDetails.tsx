import { Space, Tag, Typography } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { getExecutorConfig } from '@/constants/executionDicts';
import {
  resolveExecutionTaskTemplateId,
  resolveExecutionTaskTemplateName,
} from '@/pages/healing/executionTaskTemplateMeta';
import { getChannel, getTemplate } from '@/services/auto-healing/notification';
import { FLOW_NODE_VISUALS, getFlowNodeIcon } from './flowNodeVisuals';
import { useResolvedExecutionTemplateNames } from './useResolvedExecutionTemplateNames';

const { Text } = Typography;

type FlowNodeConfigLike = AutoHealing.FlowNodeConfig & {
  approver_roles?: string[];
  approvers?: string[];
  channel_ids?: string[];
  channel_names?: Record<string, string>;
  channel_id?: string;
  condition?: string;
  description?: string;
  executor_type?: string;
  extra_vars?: Record<string, unknown>;
  false_target?: string;
  hosts_key?: string;
  include_execution_result?: boolean;
  include_incident_info?: boolean;
  input_key?: string;
  key?: string;
  operations?: Array<{ expression?: string; output_key?: string }>;
  output_key?: string;
  source_field?: string;
  split_by?: string;
  task_template_id?: string;
  task_template_name?: string;
  task_id?: string;
  task_name?: string;
  template_id?: string;
  template_name?: string;
  notification_configs?: Array<{
    channel_id?: string;
    channel_ids?: string[];
    template_id?: string;
  }>;
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

const DetailRow: React.FC<{ label: string; value: React.ReactNode }> = ({
  label,
  value,
}) => (
  <div className="flow-node-detail-row">
    <span className="flow-node-detail-label">{label}</span>
    <span className="flow-node-detail-val">{value}</span>
  </div>
);

type NotificationConfigRef = {
  channelIds: string[];
  templateId?: string;
};

function normalizeString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value : undefined;
}

function normalizeStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map(normalizeString)
    .filter((item): item is string => Boolean(item));
}

function getNotificationConfigRefs(
  config: FlowNodeConfigLike,
): NotificationConfigRef[] {
  if (Array.isArray(config.notification_configs)) {
    return config.notification_configs
      .map((item) => {
        const channelIds = normalizeStringArray(item.channel_ids);
        const channelId = normalizeString(item.channel_id);
        if (channelId) {
          channelIds.push(channelId);
        }
        return {
          channelIds,
          templateId: normalizeString(item.template_id),
        };
      })
      .filter((item) => item.channelIds.length > 0 || item.templateId);
  }

  const channelIds = normalizeStringArray(config.channel_ids);
  const channelId = normalizeString(config.channel_id);
  if (channelId) {
    channelIds.push(channelId);
  }
  const templateId = normalizeString(config.template_id);
  if (channelIds.length > 0 || templateId) {
    return [{ channelIds, templateId }];
  }
  return [];
}

function useResolvedNotificationNames(nodes: AutoHealing.FlowNode[]) {
  const [resolvedNames, setResolvedNames] = useState<Record<string, string>>(
    {},
  );
  const requestedIdsRef = useRef(new Set<string>());
  const missingRefs = useMemo(() => {
    const refs: Array<{ id: string; kind: 'channel' | 'template' }> = [];
    nodes
      .filter((node) => node.type === 'notification')
      .forEach((node) => {
        getNotificationConfigRefs(
          (node.config || {}) as FlowNodeConfigLike,
        ).forEach((config) => {
          config.channelIds.forEach((id) => {
            const key = `channel:${id}`;
            if (!resolvedNames[key] && !requestedIdsRef.current.has(key)) {
              refs.push({ id, kind: 'channel' });
            }
          });
          if (config.templateId) {
            const key = `template:${config.templateId}`;
            if (!resolvedNames[key] && !requestedIdsRef.current.has(key)) {
              refs.push({ id: config.templateId, kind: 'template' });
            }
          }
        });
      });
    return refs;
  }, [nodes, resolvedNames]);

  useEffect(() => {
    if (missingRefs.length === 0) {
      return;
    }

    let active = true;
    missingRefs.forEach((ref) => {
      requestedIdsRef.current.add(`${ref.kind}:${ref.id}`);
    });

    void Promise.all(
      missingRefs.map(async (ref) => {
        try {
          if (ref.kind === 'channel') {
            const channel = await getChannel(ref.id);
            return [
              `channel:${ref.id}`,
              typeof channel.name === 'string' ? channel.name : '',
            ] as const;
          }
          const template = await getTemplate(ref.id);
          return [
            `template:${ref.id}`,
            typeof template.name === 'string' ? template.name : '',
          ] as const;
        } catch (error) {
          requestedIdsRef.current.delete(`${ref.kind}:${ref.id}`);
          console.error(
            'Failed to resolve notification node reference:',
            error,
          );
          return null;
        }
      }),
    ).then((entries) => {
      if (!active) {
        return;
      }
      const nextEntries = entries.filter(
        (entry): entry is NonNullable<typeof entry> => Boolean(entry?.[1]),
      );
      if (nextEntries.length > 0) {
        setResolvedNames((previous) => ({
          ...previous,
          ...Object.fromEntries(nextEntries),
        }));
      }
    });

    return () => {
      active = false;
    };
  }, [missingRefs]);

  return resolvedNames;
}

function renderExecutionDetails(
  config: FlowNodeConfigLike,
  resolvedNames: Record<string, string>,
  onEditExecutionTemplate: (taskTemplateId: string) => void,
) {
  const taskTemplateId = resolveExecutionTaskTemplateId(config);
  const taskTemplateName =
    resolveExecutionTaskTemplateName(config) ||
    (taskTemplateId ? resolvedNames[taskTemplateId] : undefined);
  const executor = config.executor_type
    ? getExecutorConfig(config.executor_type)
    : null;
  if (!taskTemplateId) {
    return (
      <DetailRow
        label="任务模板"
        value={<span style={{ color: '#faad14', fontSize: 11 }}>⚠ 未配置</span>}
      />
    );
  }

  return (
    <>
      <DetailRow
        label="任务模板"
        value={
          taskTemplateName ? (
            <a
              onClick={(event) => {
                event.stopPropagation();
                onEditExecutionTemplate(taskTemplateId);
              }}
              style={{ cursor: 'pointer' }}
            >
              {taskTemplateName}
            </a>
          ) : (
            <a
              onClick={(event) => {
                event.stopPropagation();
                onEditExecutionTemplate(taskTemplateId);
              }}
              style={{ cursor: 'pointer' }}
            >
              <Text code style={{ fontSize: 11 }}>
                {taskTemplateId}
              </Text>
            </a>
          )
        }
      />
      {executor && <DetailRow label="执行器类型" value={executor.label} />}
      {config.hosts_key && (
        <DetailRow label="主机变量" value={<code>{config.hosts_key}</code>} />
      )}
      {config.extra_vars && Object.keys(config.extra_vars).length > 0 && (
        <DetailRow
          label="额外参数"
          value={Object.entries(config.extra_vars).map(([key, value]) => (
            <Tag key={key} style={{ margin: '0 4px 2px 0', fontSize: 10 }}>
              {key}={String(value)}
            </Tag>
          ))}
        />
      )}
      {config.variable_mappings &&
        Object.keys(config.variable_mappings).length > 0 && (
          <DetailRow
            label="变量映射"
            value={Object.entries(config.variable_mappings).map(
              ([key, value]) => (
                <span key={key} style={{ display: 'block', fontSize: 11 }}>
                  <code>{key}</code> ← <code>{String(value)}</code>
                </span>
              ),
            )}
          />
        )}
    </>
  );
}

function renderApprovalDetails(config: FlowNodeConfigLike) {
  return (
    <>
      {config.title && <DetailRow label="审批标题" value={config.title} />}
      {config.description && (
        <DetailRow label="描述" value={config.description} />
      )}
      {config.approvers && config.approvers.length > 0 && (
        <DetailRow
          label="审批人"
          value={config.approvers.map((approver) => (
            <Tag key={approver} style={{ margin: '0 4px 2px 0', fontSize: 10 }}>
              {approver}
            </Tag>
          ))}
        />
      )}
      {config.approver_roles && config.approver_roles.length > 0 && (
        <DetailRow
          label="审批角色"
          value={config.approver_roles.map((role) => (
            <Tag
              key={role}
              color="blue"
              style={{ margin: '0 4px 2px 0', fontSize: 10 }}
            >
              {role}
            </Tag>
          ))}
        />
      )}
      <DetailRow
        label="超时时间"
        value={`${config.timeout_hours || 24} 小时`}
      />
    </>
  );
}

function renderNotificationDetails(
  config: FlowNodeConfigLike,
  onOpenNotificationTemplates: () => void,
  resolvedNotificationNames: Record<string, string>,
) {
  const notificationRefs = getNotificationConfigRefs(config);
  if (notificationRefs.length === 0) {
    return (
      <DetailRow
        label="配置状态"
        value={
          <span style={{ color: '#faad14', fontSize: 11 }}>
            未配置通知模板和通道
          </span>
        }
      />
    );
  }

  return (
    <>
      {notificationRefs.map((item, index) => (
        <React.Fragment
          key={`${item.templateId || 'template'}-${item.channelIds.join('-')}-${index}`}
        >
          <DetailRow
            label={
              notificationRefs.length > 1 ? `通知 ${index + 1}` : '通知模板'
            }
            value={
              item.templateId ? (
                <a
                  onClick={(event) => {
                    event.stopPropagation();
                    onOpenNotificationTemplates();
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  {config.template_name ||
                    resolvedNotificationNames[`template:${item.templateId}`] ||
                    item.templateId}
                </a>
              ) : (
                <Tag color="warning" style={{ margin: 0, fontSize: 10 }}>
                  未配置模板
                </Tag>
              )
            }
          />
          <DetailRow
            label="通知渠道"
            value={
              item.channelIds.length > 0 ? (
                <Space size={[4, 4]} wrap>
                  {item.channelIds.map((channelId) => (
                    <Tag
                      key={channelId}
                      color="blue"
                      style={{ margin: 0, fontSize: 10 }}
                    >
                      {config.channel_names?.[channelId] ||
                        resolvedNotificationNames[`channel:${channelId}`] ||
                        channelId}
                    </Tag>
                  ))}
                </Space>
              ) : (
                <Tag color="warning" style={{ margin: 0, fontSize: 10 }}>
                  未配置通道
                </Tag>
              )
            }
          />
        </React.Fragment>
      ))}
      <DetailRow
        label="携带内容"
        value={
          <Space size={[4, 4]} wrap>
            {config.include_incident_info && (
              <Tag style={{ margin: 0, fontSize: 10 }}>工单信息</Tag>
            )}
            {config.include_execution_result && (
              <Tag style={{ margin: 0, fontSize: 10 }}>执行结果</Tag>
            )}
          </Space>
        }
      />
    </>
  );
}

function renderSimpleDetails(config: FlowNodeConfigLike, type: string) {
  if (type === 'condition') {
    return (
      <>
        {config.condition && (
          <DetailRow label="表达式" value={<code>{config.condition}</code>} />
        )}
        {config.true_target && (
          <DetailRow label="✓ 分支" value={<code>{config.true_target}</code>} />
        )}
        {config.false_target && (
          <DetailRow
            label="✗ 分支"
            value={<code>{config.false_target}</code>}
          />
        )}
      </>
    );
  }

  if (type === 'host_extractor') {
    return (
      <>
        <DetailRow
          label="源字段"
          value={<code>{config.source_field || '-'}</code>}
        />
        <DetailRow
          label="提取模式"
          value={config.extract_mode === 'regex' ? '正则表达式' : '分隔符拆分'}
        />
        {config.split_by && (
          <DetailRow label="分隔符" value={<code>{config.split_by}</code>} />
        )}
        {config.output_key && (
          <DetailRow
            label="输出变量"
            value={<code>{config.output_key}</code>}
          />
        )}
      </>
    );
  }

  if (type === 'cmdb_validator') {
    return config.input_key ? (
      <DetailRow label="输入变量" value={<code>{config.input_key}</code>} />
    ) : null;
  }

  if (type === 'compute') {
    return config.operations && config.operations.length > 0 ? (
      <DetailRow
        label="运算"
        value={config.operations.map((operation, index) => (
          <span
            key={`${operation.output_key || 'op'}-${index}`}
            style={{ display: 'block', fontSize: 11 }}
          >
            <code>{operation.output_key}</code> ={' '}
            <code>{operation.expression}</code>
          </span>
        ))}
      />
    ) : null;
  }

  if (type === 'set_variable') {
    return (
      <>
        {config.key && (
          <DetailRow label="变量名" value={<code>{config.key}</code>} />
        )}
        {config.value !== undefined && (
          <DetailRow
            label="值"
            value={
              <code>
                {typeof config.value === 'object'
                  ? JSON.stringify(config.value)
                  : String(config.value)}
              </code>
            }
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
  resolvedExecutionTemplateNames: Record<string, string>,
  resolvedNotificationNames: Record<string, string>,
  onEditExecutionTemplate: (taskTemplateId: string) => void,
  onOpenNotificationTemplates: () => void,
) {
  switch (node.type) {
    case 'execution':
      return renderExecutionDetails(
        config,
        resolvedExecutionTemplateNames,
        onEditExecutionTemplate,
      );
    case 'approval':
      return renderApprovalDetails(config);
    case 'notification':
      return renderNotificationDetails(
        config,
        onOpenNotificationTemplates,
        resolvedNotificationNames,
      );
    default:
      return renderSimpleDetails(config, node.type);
  }
}

export const FlowNodeDetails: React.FC<FlowNodeDetailsProps> = ({
  nodes,
  onEditExecutionTemplate,
  onOpenNotificationTemplates,
}) => {
  const resolvedExecutionTemplateNames =
    useResolvedExecutionTemplateNames(nodes);
  const resolvedNotificationNames = useResolvedNotificationNames(nodes);

  if (nodes.length === 0) {
    return (
      <Text type="secondary" style={{ fontSize: 12 }}>
        暂无功能节点
      </Text>
    );
  }

  return (
    <div className="flow-detail-node-list">
      {nodes.map((node) => {
        const config = (node.config || {}) as FlowNodeConfigLike;
        const typeInfo = FLOW_NODE_VISUALS[node.type];

        return (
          <div key={node.id} className="flow-node-detail-card">
            <div className="flow-node-detail-header">
              <span
                className="flow-node-detail-icon"
                style={{ color: typeInfo?.color || '#8c8c8c' }}
              >
                {getFlowNodeIcon(node.type)}
              </span>
              <div className="flow-node-detail-title">
                <span className="flow-node-detail-name">
                  {node.name || String(config.label || node.id)}
                </span>
                <Tag
                  color={typeInfo?.color}
                  style={{ margin: 0, fontSize: 10 }}
                >
                  {typeInfo?.label || node.type}
                </Tag>
              </div>
            </div>
            <div className="flow-node-detail-content">
              {renderNodeSpecificDetails(
                node,
                config,
                resolvedExecutionTemplateNames,
                resolvedNotificationNames,
                onEditExecutionTemplate,
                onOpenNotificationTemplates,
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
