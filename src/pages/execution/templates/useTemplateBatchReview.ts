import { useCallback, useState } from 'react';
import { message } from 'antd';
import { batchConfirmReview, getExecutionTasks } from '@/services/auto-healing/execution';
import { fetchAllPages } from '@/utils/fetchAllPages';
import {
    invalidateSelectorInventory,
    selectorInventoryKeys,
} from '@/utils/selectorInventoryCache';
import type { ExecutionTaskRecord, ReviewGroup } from './templateListHelpers';

type UseTemplateBatchReviewOptions = {
    playbooks: AutoHealing.Playbook[];
    onRefresh: () => void;
};

export function useTemplateBatchReview({ playbooks, onRefresh }: UseTemplateBatchReviewOptions) {
    const [batchReviewOpen, setBatchReviewOpen] = useState(false);
    const [batchReviewLoading, setBatchReviewLoading] = useState(false);
    const [reviewGroups, setReviewGroups] = useState<ReviewGroup[]>([]);
    const [selectedPlaybooks, setSelectedPlaybooks] = useState<string[]>([]);

    const openBatchReview = useCallback(async () => {
        try {
            const tasks = (await fetchAllPages<AutoHealing.ExecutionTask>(
                (page, pageSize) => getExecutionTasks({ page, page_size: pageSize }),
            )).filter((task) => task.needs_review) as ExecutionTaskRecord[];
            const groups = new Map<string, ReviewGroup>();

            tasks.forEach((task) => {
                const playbookId = task.playbook_id;
                const playbook = playbooks.find((item) => item.id === playbookId);
                if (!groups.has(playbookId)) {
                    groups.set(playbookId, {
                        playbook_id: playbookId,
                        playbook_name: playbook?.name || playbookId.slice(0, 8),
                        count: 0,
                        tasks: [],
                    });
                }
                const group = groups.get(playbookId);
                if (!group) {
                    return;
                }
                group.count += 1;
                group.tasks.push(task);
            });

            const nextGroups = Array.from(groups.values());
            setReviewGroups(nextGroups);
            setSelectedPlaybooks(nextGroups.map((group) => group.playbook_id));
            setBatchReviewOpen(true);
        } catch {
            /* global error handler */
        }
    }, [playbooks]);

    const handleBatchReview = useCallback(async () => {
        if (selectedPlaybooks.length === 0) {
            message.warning('请选择至少一个 Playbook');
            return;
        }

        setBatchReviewLoading(true);
        try {
            const results = await Promise.allSettled(
                selectedPlaybooks.map(async (playbookId) => {
                    const result = await batchConfirmReview({ playbook_id: playbookId });
                    return { playbookId, confirmedCount: result.confirmed_count || 0 };
                }),
            );

            let totalConfirmed = 0;
            const successfulIds: string[] = [];
            const failedIds: string[] = [];

            results.forEach((result, index) => {
                if (result.status === 'fulfilled') {
                    totalConfirmed += result.value.confirmedCount;
                    successfulIds.push(result.value.playbookId);
                    return;
                }
                failedIds.push(selectedPlaybooks[index]);
            });

            if (successfulIds.length > 0) {
                invalidateSelectorInventory(selectorInventoryKeys.executionTasks);
                onRefresh();
            }

            if (failedIds.length === 0) {
                message.success(`已批量确认 ${totalConfirmed} 个任务模板`);
                setBatchReviewOpen(false);
                return;
            }

            setReviewGroups((prev) => prev.filter((group) => failedIds.includes(group.playbook_id)));
            setSelectedPlaybooks(failedIds);

            if (successfulIds.length > 0) {
                message.warning(`已确认 ${totalConfirmed} 个模板，仍有 ${failedIds.length} 个 Playbook 处理失败`);
                return;
            }
            message.error(`批量确认失败，${failedIds.length} 个 Playbook 未处理`);
        } catch {
            /* global error handler */
        } finally {
            setBatchReviewLoading(false);
        }
    }, [onRefresh, selectedPlaybooks]);

    return {
        batchReviewLoading,
        batchReviewOpen,
        handleBatchReview,
        openBatchReview,
        reviewGroups,
        selectedPlaybooks,
        setBatchReviewOpen,
        setSelectedPlaybooks,
    };
}
