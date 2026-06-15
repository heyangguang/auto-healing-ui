import {
  buildTaskTreeBranches,
  filterTasksByTree,
  getTreeInventoryTasks,
} from './taskTemplateSelectorHelpers';

describe('taskTemplateSelectorHelpers', () => {
  const repositories = [
    { id: 'repo-ready', name: 'Ready Repo' },
    { id: 'repo-legacy', name: 'Legacy Repo' },
  ] as AutoHealing.GitRepository[];

  const playbooks = [
    {
      id: 'playbook-ready',
      name: 'Ready Playbook',
      repository_id: 'repo-ready',
    },
    {
      id: 'playbook-review',
      name: 'Review Playbook',
      repository_id: 'repo-ready',
    },
    {
      id: 'playbook-offline',
      name: 'Offline Playbook',
      repository_id: 'repo-legacy',
      status: 'scanned',
    },
  ] as AutoHealing.Playbook[];

  const tasks = [
    {
      id: 'task-ready',
      name: 'Ready Task',
      needs_review: false,
      playbook: {
        id: 'playbook-ready',
        name: 'Ready Playbook',
        status: 'ready',
      },
    },
    {
      id: 'task-review',
      name: 'Review Task',
      needs_review: true,
      playbook: {
        id: 'playbook-review',
        name: 'Review Playbook',
        status: 'ready',
      },
    },
    {
      id: 'task-offline',
      name: 'Offline Task',
      needs_review: false,
      playbook: {
        id: 'playbook-offline',
        name: 'Offline Playbook',
        status: 'scanned',
      },
    },
    {
      id: 'task-outdated',
      name: 'Outdated Task',
      needs_review: false,
      playbook: {
        id: 'playbook-ready',
        name: 'Ready Playbook',
        status: 'outdated',
      },
    },
  ] as AutoHealing.ExecutionTask[];

  it('keeps only selectable tasks in the default left tree inventory', () => {
    const treeTasks = getTreeInventoryTasks(
      tasks,
      {
        executorType: undefined,
        search: '',
        selectedTreeKey: 'all',
        statusFilter: undefined,
      },
      null,
    );

    expect(treeTasks.map((task) => task.id)).toEqual([
      'task-ready',
      'task-outdated',
    ]);
  });

  it('builds tree branches only for repositories and playbooks with available tasks', () => {
    const treeBranches = buildTaskTreeBranches(repositories, playbooks, [
      tasks[0],
      tasks[3],
    ]);

    expect(treeBranches).toEqual([
      {
        playbooks: [
          {
            playbookId: 'playbook-ready',
            playbookName: 'Ready Playbook',
            taskCount: 2,
          },
        ],
        repoId: 'repo-ready',
        repoName: 'Ready Repo',
        taskCount: 2,
      },
    ]);
  });

  it('filters the right list by playbook leaf selection', () => {
    const filteredTasks = filterTasksByTree(
      tasks,
      'playbook-playbook-review',
      playbooks,
    );

    expect(filteredTasks.map((task) => task.id)).toEqual(['task-review']);
  });
});
