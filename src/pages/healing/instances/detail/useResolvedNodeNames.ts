import { useEffect, useState } from 'react';
import { getChannel, getTemplate } from '@/services/auto-healing/notification';
import { getExecutionTask } from '@/services/auto-healing/executionTasks';
import { getExecutionRun } from '@/services/auto-healing/executionRuns';
import type { SelectedNodeDataLike } from './nodeDetailTypes';

type NameMap = Record<string, string>;

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

export const useResolvedNodeNames = (selectedNodeData?: SelectedNodeDataLike | null) => {
    const [resolvedNames, setResolvedNames] = useState<NameMap>({});
    const [resolutionErrors, setResolutionErrors] = useState<NameMap>({});

    useEffect(() => {
        if (!selectedNodeData?.config) return;

        const config = selectedNodeData.config;
        const nodeState = selectedNodeData.state;
        const nodeType = config.type;

        const fetchNames = async () => {
            const nextNames: NameMap = {};
            const nextErrors: NameMap = {};

            if (nodeType === 'notification' || nodeType === 'send_notification') {
                const channelId = config.channel_id || config.notification_channel_id;
                const templateId = config.template_id || config.notification_template_id;
                if (typeof channelId === 'string' && !resolvedNames[channelId] && !resolutionErrors[channelId]) {
                    try {
                        const channel = await getChannel(channelId);
                        if (typeof channel.name === 'string') nextNames[channelId] = channel.name;
                    } catch (error) {
                        nextErrors[channelId] = `通知渠道 ${channelId} 名称解析失败: ${error instanceof Error ? error.message : '未知错误'}`;
                    }
                }
                if (typeof templateId === 'string' && !resolvedNames[templateId] && !resolutionErrors[templateId]) {
                    try {
                        const template = await getTemplate(templateId);
                        if (typeof template.name === 'string') nextNames[templateId] = template.name;
                    } catch (error) {
                        nextErrors[templateId] = `通知模板 ${templateId} 名称解析失败: ${error instanceof Error ? error.message : '未知错误'}`;
                    }
                }
            }

            if (nodeType === 'execution') {
                const taskId = config.task_id || config.task_template_id || nodeState?.task_id || nodeState?.run?.task_id;
                if (typeof taskId === 'string' && !resolvedNames[taskId] && !resolutionErrors[taskId]) {
                    try {
                        const taskResponse = await getExecutionTask(taskId);
                        if (typeof taskResponse.data.name === 'string') {
                            nextNames[taskId] = taskResponse.data.name;
                        }
                    } catch (error) {
                        nextErrors[taskId] = `执行任务 ${taskId} 名称解析失败: ${error instanceof Error ? error.message : '未知错误'}`;
                    }
                }

                const runId = config.run_id || nodeState?.run?.run_id;
                const runStatusKey = typeof runId === 'string' ? `run:${runId}` : '';
                if (typeof runId === 'string' && !resolvedNames[runStatusKey] && !resolutionErrors[runStatusKey]) {
                    try {
                        const runResponse = await getExecutionRun(runId);
                        const run = runResponse.data;
                        if (isRecord(run.task) && typeof run.task.name === 'string') {
                            nextNames[`task:${String(run.task_id || taskId)}`] = run.task.name;
                        }
                        if (isRecord(run.task) && typeof run.task.target_hosts === 'string') {
                            nextNames[`hosts:${runId}`] = run.task.target_hosts;
                        }
                        if (typeof run.status === 'string') {
                            nextNames[runStatusKey] = run.status;
                        }
                    } catch (error) {
                        nextErrors[runStatusKey] = `执行记录 ${runId} 状态解析失败: ${error instanceof Error ? error.message : '未知错误'}`;
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

const isRecord = (value: unknown): value is Record<string, unknown> => (
    Boolean(value) && typeof value === 'object' && !Array.isArray(value)
);
