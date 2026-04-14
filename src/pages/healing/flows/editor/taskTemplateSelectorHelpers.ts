import { PAGE_SIZE } from './taskTemplateSelectorTypes';
import type {
    ExecutionTaskListParams,
    TaskTemplate,
    TaskTemplateFilters,
} from './taskTemplateSelectorTypes';

export function getRepoIdFromTreeKey(treeKey: string) {
    return treeKey.startsWith('repo-') ? treeKey.replace('repo-', '') : undefined;
}

export function getPlaybookIdFromTreeKey(treeKey: string) {
    return treeKey.startsWith('playbook-') ? treeKey.replace('playbook-', '') : undefined;
}

export function getRepoPlaybookIds(playbooks: AutoHealing.Playbook[], repoId?: string) {
    if (!repoId) {
        return [];
    }

    return playbooks
        .filter((playbook) => playbook.repository_id === repoId)
        .map((playbook) => playbook.id);
}

export function getTaskPlaybookId(task: TaskTemplate) {
    return task.playbook?.id || task.playbook_id;
}

export function isTaskSelectable(task: TaskTemplate) {
    return !task.needs_review && (!task.playbook || task.playbook.status === 'ready');
}

export function matchesTaskFilters(
    task: TaskTemplate,
    filters: TaskTemplateFilters,
) {
    if (filters.search) {
        const query = filters.search.trim().toLowerCase();
        const haystack = [task.name, task.description, task.playbook?.name]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();
        if (!haystack.includes(query)) {
            return false;
        }
    }

    if (filters.executorType && task.executor_type !== filters.executorType) {
        return false;
    }

    if (filters.statusFilter === 'ready' && task.needs_review) {
        return false;
    }

    if (filters.statusFilter === 'review' && !task.needs_review) {
        return false;
    }

    return true;
}

export function buildTaskParams(
    filters: TaskTemplateFilters,
    playbooks: AutoHealing.Playbook[],
): ExecutionTaskListParams {
    const params: ExecutionTaskListParams = { page_size: PAGE_SIZE };
    const playbookId = getPlaybookIdFromTreeKey(filters.selectedTreeKey);

    if (playbookId) {
        params.playbook_id = playbookId;
    }

    const repoId = getRepoIdFromTreeKey(filters.selectedTreeKey);
    if (repoId) {
        const repoPlaybookIds = getRepoPlaybookIds(playbooks, repoId);
        if (repoPlaybookIds.length === 1) {
            params.playbook_id = repoPlaybookIds[0];
        }
    }

    if (filters.search) {
        params.name = filters.search;
    }
    if (filters.executorType) {
        params.executor_type = filters.executorType;
    }
    if (filters.statusFilter === 'ready') {
        params.status = 'ready';
    }
    if (filters.statusFilter === 'review') {
        params.status = 'pending_review';
    }

    return params;
}

export function matchesTask(
    task: TaskTemplate,
    repoPlaybookIds: string[],
    filters: TaskTemplateFilters,
) {
    const playbookId = getTaskPlaybookId(task);
    if (!playbookId || !repoPlaybookIds.includes(playbookId)) {
        return false;
    }

    return matchesTaskFilters(task, filters);
}

export function dedupeTasks(tasks: TaskTemplate[]) {
    const seen = new Set<string>();
    return tasks.filter((task) => {
        if (seen.has(task.id)) {
            return false;
        }
        seen.add(task.id);
        return true;
    });
}

export function isMultiPlaybookRepoSelection(
    filters: TaskTemplateFilters,
    playbooks: AutoHealing.Playbook[],
) {
    const repoId = getRepoIdFromTreeKey(filters.selectedTreeKey);
    if (!repoId) {
        return false;
    }

    return getRepoPlaybookIds(playbooks, repoId).length > 1;
}

export function filterTasksByTree(
    tasks: TaskTemplate[],
    selectedTreeKey: string,
    playbooks: AutoHealing.Playbook[],
) {
    const playbookId = getPlaybookIdFromTreeKey(selectedTreeKey);
    if (playbookId) {
        return tasks.filter((task) => getTaskPlaybookId(task) === playbookId);
    }

    const repoId = getRepoIdFromTreeKey(selectedTreeKey);
    if (!repoId) {
        return tasks;
    }

    const repoPlaybookIds = getRepoPlaybookIds(playbooks, repoId);
    return tasks.filter((task) => {
        const playbookId = getTaskPlaybookId(task);
        return Boolean(playbookId && repoPlaybookIds.includes(playbookId));
    });
}

type TreeBranch = {
    playbooks: Array<{
        playbookId: string;
        playbookName: string;
        taskCount: number;
    }>;
    repoId: string;
    repoName: string;
    taskCount: number;
};

export function getTreeInventoryTasks(
    tasks: TaskTemplate[],
    filters: TaskTemplateFilters,
    selectedTask: TaskTemplate | null,
) {
    const keepSelectedTaskVisible = !filters.search && !filters.executorType && !filters.statusFilter;
    return dedupeTasks(tasks.filter((task) => {
        if (keepSelectedTaskVisible && selectedTask?.id === task.id) {
            return true;
        }
        if (!matchesTaskFilters(task, filters)) {
            return false;
        }
        if (filters.statusFilter === 'review') {
            return true;
        }
        return isTaskSelectable(task);
    }));
}

export function buildTaskTreeBranches(
    repositories: AutoHealing.GitRepository[],
    playbooks: AutoHealing.Playbook[],
    tasks: TaskTemplate[],
): TreeBranch[] {
    const taskCountByPlaybookId = tasks.reduce<Map<string, number>>((counts, task) => {
        const playbookId = getTaskPlaybookId(task);
        if (!playbookId) {
            return counts;
        }
        counts.set(playbookId, (counts.get(playbookId) || 0) + 1);
        return counts;
    }, new Map<string, number>());

    return repositories.reduce<TreeBranch[]>((branches, repository) => {
        const repoPlaybooks = playbooks
            .filter((playbook) => playbook.repository_id === repository.id)
            .map((playbook) => ({
                playbookId: playbook.id,
                playbookName: playbook.name,
                taskCount: taskCountByPlaybookId.get(playbook.id) || 0,
            }))
            .filter((playbook) => playbook.taskCount > 0);

        if (repoPlaybooks.length === 0) {
            return branches;
        }

        branches.push({
            playbooks: repoPlaybooks,
            repoId: repository.id,
            repoName: repository.name,
            taskCount: repoPlaybooks.reduce((count, playbook) => count + playbook.taskCount, 0),
        });
        return branches;
    }, []);
}

export function getDefaultExpandedKeys(repositories: AutoHealing.GitRepository[]) {
    return repositories.slice(0, 3).map((repo) => `repo-${repo.id}`);
}
