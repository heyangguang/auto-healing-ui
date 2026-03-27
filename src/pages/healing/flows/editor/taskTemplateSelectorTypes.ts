import type { getExecutionTasks } from '@/services/auto-healing/execution';

export type TaskTemplate = AutoHealing.ExecutionTask;
export type ExecutionTaskListParams = NonNullable<Parameters<typeof getExecutionTasks>[0]>;
export type TaskTemplateStatusFilter = 'ready' | 'review';

export interface TaskTemplateSelectorProps {
    open: boolean;
    value?: string;
    onSelect: (id: string, template: TaskTemplate) => void;
    onCancel: () => void;
}

export interface TaskTemplateFilters {
    selectedTreeKey: string;
    search: string;
    executorType?: string;
    statusFilter?: TaskTemplateStatusFilter;
}

export type TaskTemplateSelectorFilters = TaskTemplateFilters;

export interface TaskTemplateInventory {
    repositories: AutoHealing.GitRepository[];
    playbooks: AutoHealing.Playbook[];
}

export interface TaskTemplateSelectorState extends TaskTemplateInventory, TaskTemplateFilters {
    initLoading: boolean;
    tasks: TaskTemplate[];
    tasksLoading: boolean;
    tasksTotal: number;
    page: number;
    hasMore: boolean;
    expandedKeys: string[];
    selectedTaskId?: string;
    selectedTask: TaskTemplate | null;
}

export const PAGE_SIZE = 50;
