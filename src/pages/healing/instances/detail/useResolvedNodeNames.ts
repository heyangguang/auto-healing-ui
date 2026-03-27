import { request } from '@umijs/max';
import { useEffect, useState } from 'react';
import type { SelectedNodeDataLike } from './nodeDetailTypes';

const mergeNames = (nextNames: Record<string, string>, setNames: React.Dispatch<React.SetStateAction<Record<string, string>>>) => {
    if (Object.keys(nextNames).length > 0) {
        setNames((previous) => ({ ...previous, ...nextNames }));
    }
};

const fetchEntity = async (path: string) => {
    const response = await request<Record<string, unknown>>(`/api/v1/tenant/${path}`);
    return (response?.data as Record<string, unknown> | undefined) || response;
};

export const useResolvedNodeNames = (selectedNodeData?: SelectedNodeDataLike | null) => {
    const [resolvedNames, setResolvedNames] = useState<Record<string, string>>({});

    useEffect(() => {
        if (!selectedNodeData?.config) return;

        const config = selectedNodeData.config;
        const nodeState = selectedNodeData.state;
        const nodeType = config.type;

        const fetchNames = async () => {
            const nextNames: Record<string, string> = {};

            if (nodeType === 'notification' || nodeType === 'send_notification') {
                const channelId = config.channel_id || config.notification_channel_id;
                const templateId = config.template_id || config.notification_template_id;
                if (typeof channelId === 'string' && !resolvedNames[channelId]) {
                    try {
                        const data = await fetchEntity(`channels/${channelId}`);
                        if (typeof data?.name === 'string') nextNames[channelId] = data.name;
                    } catch {
                        // expose nothing; UI keeps raw ids
                    }
                }
                if (typeof templateId === 'string' && !resolvedNames[templateId]) {
                    try {
                        const data = await fetchEntity(`templates/${templateId}`);
                        if (typeof data?.name === 'string') nextNames[templateId] = data.name;
                    } catch {
                        // expose nothing; UI keeps raw ids
                    }
                }
            }

            if (nodeType === 'execution') {
                const taskId = config.task_id || config.task_template_id || nodeState?.task_id || nodeState?.run?.task_id;
                if (typeof taskId === 'string' && !resolvedNames[taskId]) {
                    try {
                        const data = await fetchEntity(`execution-tasks/${taskId}`);
                        if (typeof data?.name === 'string') nextNames[taskId] = data.name;
                    } catch {
                        // expose nothing; UI keeps raw ids
                    }
                }

                const runId = config.run_id || nodeState?.run?.run_id;
                if (typeof runId === 'string' && !resolvedNames[`run:${runId}`]) {
                    try {
                        const data = await fetchEntity(`execution-runs/${runId}`);
                        if (isRecord(data?.task) && typeof data.task.name === 'string') {
                            nextNames[`task:${String(data.task_id || taskId)}`] = data.task.name;
                        }
                        if (isRecord(data?.task) && typeof data.task.target_hosts === 'string') {
                            nextNames[`hosts:${runId}`] = data.task.target_hosts;
                        }
                        if (typeof data?.status === 'string') {
                            nextNames[`run:${runId}`] = data.status;
                        }
                    } catch {
                        // expose nothing; UI keeps raw ids
                    }
                }
            }

            mergeNames(nextNames, setResolvedNames);
        };

        void fetchNames();
    }, [resolvedNames, selectedNodeData]);

    return resolvedNames;
};

const isRecord = (value: unknown): value is Record<string, unknown> => (
    Boolean(value) && typeof value === 'object' && !Array.isArray(value)
);
