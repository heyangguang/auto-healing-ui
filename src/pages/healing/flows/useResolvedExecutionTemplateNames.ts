import { useEffect, useMemo, useRef, useState } from 'react';
import { getExecutionTask } from '@/services/auto-healing/execution';
import {
    resolveExecutionTaskTemplateId,
    resolveExecutionTaskTemplateName,
} from '@/pages/healing/executionTaskTemplateMeta';

export function useResolvedExecutionTemplateNames(nodes: AutoHealing.FlowNode[]) {
    const [resolvedNames, setResolvedNames] = useState<Record<string, string>>({});
    const requestedIdsRef = useRef(new Set<string>());
    const missingTaskIds = useMemo(() => nodes
        .filter((node) => node.type === 'execution')
        .map((node) => node.config || {})
        .map((config) => ({
            taskTemplateId: resolveExecutionTaskTemplateId(config),
            taskTemplateName: resolveExecutionTaskTemplateName(config),
        }))
        .filter(({ taskTemplateId, taskTemplateName }) => Boolean(taskTemplateId) && !taskTemplateName)
        .map(({ taskTemplateId }) => String(taskTemplateId))
        .filter((taskTemplateId) => !resolvedNames[taskTemplateId] && !requestedIdsRef.current.has(taskTemplateId)), [nodes, resolvedNames]);

    useEffect(() => {
        if (missingTaskIds.length === 0) {
            return;
        }

        let active = true;
        missingTaskIds.forEach((taskTemplateId) => requestedIdsRef.current.add(taskTemplateId));

        void Promise.all(missingTaskIds.map(async (taskTemplateId) => {
            try {
                const response = await getExecutionTask(taskTemplateId);
                return [taskTemplateId, typeof response.data?.name === 'string' ? response.data.name : ''] as const;
            } catch (error) {
                requestedIdsRef.current.delete(taskTemplateId);
                console.error('Failed to resolve flow execution task template name:', error);
                return null;
            }
        })).then((entries) => {
            if (!active) {
                return;
            }
            const nextEntries = entries.filter((entry): entry is readonly [string, string] => Boolean(entry?.[1]));
            if (nextEntries.length > 0) {
                setResolvedNames((previous) => ({ ...previous, ...Object.fromEntries(nextEntries) }));
            }
        });

        return () => {
            active = false;
        };
    }, [missingTaskIds]);

    return resolvedNames;
}
