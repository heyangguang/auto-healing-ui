import { useEffect, useState } from 'react';
import { getExecutionRun } from '@/services/auto-healing/executionRuns';
import { getExecutionTask } from '@/services/auto-healing/executionTasks';
import { getChannel, getTemplate } from '@/services/auto-healing/notification';
import {
  resolveExecutionRunId,
  resolveExecutionTaskId,
} from './executionNodeMeta';
import type { SelectedNodeDataLike } from './nodeDetailTypes';

type NameMap = Record<string, string>;
type NotificationConfigRef = {
  channel_id?: unknown;
  template_id?: unknown;
};

type ResolvedNodeNamesState = {
  resolvedNames: NameMap;
  resolutionErrors: NameMap;
};

const mergeMap = (
  nextMap: NameMap,
  setMap: React.Dispatch<React.SetStateAction<NameMap>>,
) => {
  if (Object.keys(nextMap).length === 0) {
    return;
  }

  setMap((previous) => ({ ...previous, ...nextMap }));
};

const mergeNames = (
  nextNames: NameMap,
  setNames: React.Dispatch<React.SetStateAction<NameMap>>,
) => {
  if (Object.keys(nextNames).length > 0) {
    setNames((previous) => ({ ...previous, ...nextNames }));
  }
};

function collectNotificationReferences(config: Record<string, unknown>) {
  const channelIds = new Set<string>();
  const templateIds = new Set<string>();

  const addChannel = (value: unknown) => {
    if (typeof value === 'string' && value.trim()) {
      channelIds.add(value);
    }
  };
  const addTemplate = (value: unknown) => {
    if (typeof value === 'string' && value.trim()) {
      templateIds.add(value);
    }
  };

  addChannel(config.channel_id);
  addChannel(config.notification_channel_id);
  if (Array.isArray(config.channel_ids)) {
    config.channel_ids.forEach(addChannel);
  }

  addTemplate(config.template_id);
  addTemplate(config.notification_template_id);

  if (Array.isArray(config.notification_configs)) {
    config.notification_configs.forEach((item) => {
      if (item && typeof item === 'object' && !Array.isArray(item)) {
        const ref = item as NotificationConfigRef;
        addChannel(ref.channel_id);
        addTemplate(ref.template_id);
      }
    });
  }

  return {
    channelIds: Array.from(channelIds),
    templateIds: Array.from(templateIds),
  };
}

export const useResolvedNodeNames = (
  selectedNodeData?: SelectedNodeDataLike | null,
) => {
  const [resolvedNames, setResolvedNames] = useState<NameMap>({});
  const [resolutionErrors, setResolutionErrors] = useState<NameMap>({});

  useEffect(() => {
    if (!selectedNodeData?.config) return;

    const config = selectedNodeData.config;
    const nodeType = selectedNodeData.type || config.type;

    const fetchNames = async () => {
      const nextNames: NameMap = {};
      const nextErrors: NameMap = {};

      if (nodeType === 'notification' || nodeType === 'send_notification') {
        const { channelIds, templateIds } =
          collectNotificationReferences(config);
        await Promise.all(
          channelIds.map(async (channelId) => {
            if (resolvedNames[channelId] || resolutionErrors[channelId]) {
              return;
            }
            try {
              const channel = await getChannel(channelId);
              if (typeof channel.name === 'string')
                nextNames[channelId] = channel.name;
            } catch (error) {
              nextErrors[channelId] =
                `通知渠道 ${channelId} 名称解析失败: ${error instanceof Error ? error.message : '未知错误'}`;
            }
          }),
        );
        await Promise.all(
          templateIds.map(async (templateId) => {
            if (resolvedNames[templateId] || resolutionErrors[templateId]) {
              return;
            }
            try {
              const template = await getTemplate(templateId);
              if (typeof template.name === 'string')
                nextNames[templateId] = template.name;
            } catch (error) {
              nextErrors[templateId] =
                `通知模板 ${templateId} 名称解析失败: ${error instanceof Error ? error.message : '未知错误'}`;
            }
          }),
        );
      }

      if (nodeType === 'execution') {
        const taskId = resolveExecutionTaskId(selectedNodeData);
        if (
          typeof taskId === 'string' &&
          !resolvedNames[taskId] &&
          !resolutionErrors[taskId]
        ) {
          try {
            const taskResponse = await getExecutionTask(taskId);
            if (typeof taskResponse.data.name === 'string') {
              nextNames[taskId] = taskResponse.data.name;
            }
          } catch (error) {
            nextErrors[taskId] =
              `执行任务 ${taskId} 名称解析失败: ${error instanceof Error ? error.message : '未知错误'}`;
          }
        }

        const runId = resolveExecutionRunId(selectedNodeData);
        const runStatusKey = typeof runId === 'string' ? `run:${runId}` : '';
        if (
          typeof runId === 'string' &&
          !resolvedNames[runStatusKey] &&
          !resolutionErrors[runStatusKey]
        ) {
          try {
            const runResponse = await getExecutionRun(runId);
            const run = runResponse.data;
            if (isRecord(run.task) && typeof run.task.name === 'string') {
              nextNames[`task:${String(run.task_id || taskId)}`] =
                run.task.name;
            }
            if (
              isRecord(run.task) &&
              typeof run.task.target_hosts === 'string'
            ) {
              nextNames[`hosts:${runId}`] = run.task.target_hosts;
            }
            if (typeof run.status === 'string') {
              nextNames[runStatusKey] = run.status;
            }
          } catch (error) {
            nextErrors[runStatusKey] =
              `执行记录 ${runId} 状态解析失败: ${error instanceof Error ? error.message : '未知错误'}`;
          }
        }
      }

      mergeNames(nextNames, setResolvedNames);
      mergeMap(nextErrors, setResolutionErrors);
    };

    void fetchNames();
  }, [resolutionErrors, resolvedNames, selectedNodeData]);

  return {
    resolvedNames,
    resolutionErrors,
  } satisfies ResolvedNodeNamesState;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);
