import { getExecutionTasks } from '@/services/auto-healing/execution';
import {
    getCachedExecutionTaskInventory,
} from '@/utils/selectorInventoryCache';
import {
    buildTaskParams,
    dedupeTasks,
    getRepoIdFromTreeKey,
    getRepoPlaybookIds,
    matchesTask,
} from './taskTemplateSelectorHelpers';
import type {
    TaskTemplate,
    TaskTemplateFilters,
    TaskTemplateInventory,
    TaskTemplateSelectorState,
} from './taskTemplateSelectorTypes';
import { PAGE_SIZE } from './taskTemplateSelectorTypes';

export interface TaskPageState {
    tasks: TaskTemplate[];
    tasksTotal: number;
    page: number;
    hasMore: boolean;
}

export interface LoadTasksOptions {
    reset?: boolean;
    forceRefresh?: boolean;
    inventory?: TaskTemplateInventory;
    filters?: TaskTemplateFilters;
    preselectedId?: string;
}

export type SelectorAction =
    | { type: 'appendTasks'; payload: TaskPageState }
    | { type: 'patch'; patch: Partial<TaskTemplateSelectorState> }
    | { type: 'replaceTasks'; payload: TaskPageState }
    | { type: 'reset'; value?: string };

export const EMPTY_INVENTORY: TaskTemplateInventory = {
    repositories: [],
    playbooks: [],
};
export const FILTER_DEBOUNCE_MS = 300;
export const SCROLL_THRESHOLD_PX = 100;

export function createInitialState(value?: string): TaskTemplateSelectorState {
    return {
        ...EMPTY_INVENTORY,
        initLoading: true,
        tasks: [],
        tasksLoading: false,
        tasksTotal: 0,
        page: 1,
        hasMore: true,
        selectedTreeKey: 'all',
        expandedKeys: [],
        search: '',
        executorType: undefined,
        statusFilter: undefined,
        selectedTaskId: value,
        selectedTask: null,
    };
}

export function reducer(state: TaskTemplateSelectorState, action: SelectorAction) {
    switch (action.type) {
        case 'appendTasks':
            return {
                ...state,
                ...action.payload,
                tasks: [...state.tasks, ...action.payload.tasks],
            };
        case 'patch':
            return { ...state, ...action.patch };
        case 'replaceTasks':
            return { ...state, ...action.payload };
        case 'reset':
            return createInitialState(action.value);
        default:
            return state;
    }
}

export function getFiltersSnapshot(state: TaskTemplateSelectorState): TaskTemplateFilters {
    return {
        selectedTreeKey: state.selectedTreeKey,
        search: state.search,
        executorType: state.executorType,
        statusFilter: state.statusFilter,
    };
}

export async function fetchTaskPage(
    pageNum: number,
    filters: TaskTemplateFilters,
    inventory: TaskTemplateInventory,
    forceRefresh: boolean,
): Promise<TaskPageState> {
    const repoId = getRepoIdFromTreeKey(filters.selectedTreeKey);
    const repoPlaybookIds = getRepoPlaybookIds(inventory.playbooks, repoId);

    if (repoId && repoPlaybookIds.length > 1) {
        const inventoryTasks = await getCachedExecutionTaskInventory({ forceRefresh });
        const tasks = dedupeTasks(
            inventoryTasks.filter((task) => matchesTask(task as TaskTemplate, repoPlaybookIds, filters)),
        );
        return { tasks, tasksTotal: tasks.length, page: 1, hasMore: false };
    }

    const response = await getExecutionTasks({
        ...buildTaskParams(filters, inventory.playbooks),
        page: pageNum,
    });
    const total = response.total || 0;
    return {
        tasks: response.data || [],
        tasksTotal: total,
        page: pageNum,
        hasMore: pageNum * PAGE_SIZE < total,
    };
}
