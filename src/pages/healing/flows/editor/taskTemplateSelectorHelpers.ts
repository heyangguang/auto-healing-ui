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

export function getDefaultExpandedKeys(repositories: AutoHealing.GitRepository[]) {
    return repositories.slice(0, 3).map((repo) => `repo-${repo.id}`);
}
