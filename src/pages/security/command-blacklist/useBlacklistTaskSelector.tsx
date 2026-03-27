import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { DataNode } from 'antd/es/tree';
import { BookOutlined, CodeOutlined, FolderOutlined } from '@ant-design/icons';
import { Space, Tag, message } from 'antd';
import { getExecutionTasks } from '@/services/auto-healing/execution';
import { createRequestSequence } from '@/utils/requestSequence';
import {
    getCachedGitRepoInventory,
    getCachedPlaybookInventory,
} from '@/utils/selectorInventoryCache';
import {
    PAGE_SIZE,
} from './blacklistRuleFormOptions';
import { findPlaybookById } from './blacklistRuleFormUtils';

type TaskSelectorParams = {
    page_size: number;
    page?: number;
    playbook_id?: string;
    name?: string;
    executor_type?: string;
    status?: 'ready' | 'pending_review';
};

type UseBlacklistTaskSelectorOptions = {
    open: boolean;
};

const buildTaskParams = (options: {
    executorType?: string;
    selectedTreeKey: string;
    statusFilter?: string;
    taskSearch: string;
}): TaskSelectorParams => {
    const params: TaskSelectorParams = { page_size: PAGE_SIZE };
    if (options.selectedTreeKey.startsWith('playbook-')) {
        params.playbook_id = options.selectedTreeKey.replace('playbook-', '');
    }
    if (options.taskSearch) {
        params.name = options.taskSearch;
    }
    if (options.executorType) {
        params.executor_type = options.executorType;
    }
    if (options.statusFilter === 'ready') {
        params.status = 'ready';
    }
    if (options.statusFilter === 'review') {
        params.status = 'pending_review';
    }
    return params;
};

const buildTreeData = (
    repositories: AutoHealing.GitRepository[],
    playbookList: AutoHealing.Playbook[],
    tasksTotal: number,
): DataNode[] => {
    const repoNodes = repositories.map((repo) => {
        const repoPlaybooks = playbookList.filter((playbook) => playbook.repository_id === repo.id);
        return {
            key: `repo-${repo.id}`,
            title: (
                <Space>
                    {repo.name}
                    <Tag style={{ fontSize: 10 }}>{repoPlaybooks.length}</Tag>
                </Space>
            ),
            icon: <FolderOutlined style={{ color: '#1890ff' }} />,
            children: repoPlaybooks.map((playbook) => ({
                key: `playbook-${playbook.id}`,
                title: playbook.name,
                icon: <BookOutlined style={{ color: '#52c41a' }} />,
                isLeaf: true,
            })),
        };
    });

    return [
        {
            key: 'all',
            title: (
                <Space>
                    全部任务
                    <Tag style={{ fontSize: 10 }}>{tasksTotal}</Tag>
                </Space>
            ),
            icon: <CodeOutlined style={{ color: '#722ed1' }} />,
            isLeaf: true,
        },
        ...repoNodes,
    ];
};

export const useBlacklistTaskSelector = ({ open }: UseBlacklistTaskSelectorOptions) => {
    const [repositories, setRepositories] = useState<AutoHealing.GitRepository[]>([]);
    const [playbookList, setPlaybookList] = useState<AutoHealing.Playbook[]>([]);
    const [tasks, setTasks] = useState<AutoHealing.ExecutionTask[]>([]);
    const [tasksLoading, setTasksLoading] = useState(false);
    const [tasksTotal, setTasksTotal] = useState(0);
    const [taskPage, setTaskPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [initLoading, setInitLoading] = useState(true);
    const [selectedTreeKey, setSelectedTreeKey] = useState('all');
    const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
    const [taskSearch, setTaskSearch] = useState('');
    const [executorType, setExecutorType] = useState<string | undefined>();
    const [statusFilter, setStatusFilter] = useState<string | undefined>();
    const [pendingTask, setPendingTask] = useState<AutoHealing.ExecutionTask | null>(null);

    const tasksLoadingRef = useRef(false);
    const tasksRequestSequenceRef = useRef(createRequestSequence());
    const baseDataSequenceRef = useRef(createRequestSequence());

    const loadTasks = useCallback(async (pageNum: number, reset: boolean) => {
        if (tasksLoadingRef.current && !reset) {
            return;
        }
        const token = tasksRequestSequenceRef.current.next();
        tasksLoadingRef.current = true;
        setTasksLoading(true);

        try {
            const params = {
                ...buildTaskParams({
                    selectedTreeKey,
                    taskSearch,
                    executorType,
                    statusFilter,
                }),
                page: pageNum,
            };
            const response = await getExecutionTasks(params);
            if (!tasksRequestSequenceRef.current.isCurrent(token)) {
                return;
            }

            const nextTasks = response.data || [];
            const total = response.total || 0;
            setTasks((current) => (reset ? nextTasks : [...current, ...nextTasks]));
            setTasksTotal(total);
            setTaskPage(pageNum);
            setHasMore(pageNum * PAGE_SIZE < total);
        } catch {
            if (tasksRequestSequenceRef.current.isCurrent(token)) {
                message.error('加载任务模板列表失败，请稍后重试');
            }
        } finally {
            if (tasksRequestSequenceRef.current.isCurrent(token)) {
                tasksLoadingRef.current = false;
                setTasksLoading(false);
            }
        }
    }, [executorType, selectedTreeKey, statusFilter, taskSearch]);

    const loadBaseData = useCallback(async () => {
        const token = baseDataSequenceRef.current.next();
        setInitLoading(true);
        try {
            const [playbooks, repositories] = await Promise.all([
                getCachedPlaybookInventory(),
                getCachedGitRepoInventory(),
            ]);
            if (!baseDataSequenceRef.current.isCurrent(token)) {
                return;
            }

            setPlaybookList(playbooks);
            setRepositories(repositories);
            if (repositories.length > 0) {
                setExpandedKeys(repositories.slice(0, 3).map((repo) => `repo-${repo.id}`));
            }
        } catch {
            if (baseDataSequenceRef.current.isCurrent(token)) {
                message.error('加载任务模板基础数据失败，请稍后重试');
            }
        } finally {
            if (baseDataSequenceRef.current.isCurrent(token)) {
                setInitLoading(false);
            }
        }
    }, []);

    useEffect(() => {
        if (open) {
            void loadBaseData();
            return;
        }

        tasksRequestSequenceRef.current.invalidate();
        baseDataSequenceRef.current.invalidate();
        tasksLoadingRef.current = false;
        setTasksLoading(false);
        setTasks([]);
        setTasksTotal(0);
        setTaskPage(1);
        setHasMore(true);
        setTaskSearch('');
        setExecutorType(undefined);
        setStatusFilter(undefined);
        setSelectedTreeKey('all');
        setExpandedKeys([]);
        setRepositories([]);
        setPlaybookList([]);
        setPendingTask(null);
    }, [loadBaseData, open]);

    useEffect(() => {
        if (!initLoading && open) {
            setTasks([]);
            setTasksTotal(0);
            setTaskPage(1);
            setHasMore(true);
            const timer = setTimeout(() => {
                void loadTasks(1, true);
            }, 300);
            return () => clearTimeout(timer);
        }
        return undefined;
    }, [initLoading, loadTasks, open, selectedTreeKey, taskSearch, executorType, statusFilter]);

    useEffect(() => {
        if (!open) {
            return;
        }
        setPendingTask(null);
    }, [executorType, open, selectedTreeKey, statusFilter, taskSearch]);

    const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
        const { clientHeight, scrollHeight, scrollTop } = event.currentTarget;
        if (scrollHeight - scrollTop - clientHeight < 100 && !tasksLoading && hasMore) {
            void loadTasks(taskPage + 1, false);
        }
    }, [hasMore, loadTasks, taskPage, tasksLoading]);

    const displayTasks = useMemo(() => {
        if (!selectedTreeKey.startsWith('repo-')) {
            return tasks;
        }
        const repoId = selectedTreeKey.replace('repo-', '');
        const repoPlaybookIds = playbookList
            .filter((playbook) => playbook.repository_id === repoId)
            .map((playbook) => playbook.id);
        return tasks.filter((task) => task.playbook_id && repoPlaybookIds.includes(task.playbook_id));
    }, [playbookList, selectedTreeKey, tasks]);

    const treeData = useMemo(
        () => buildTreeData(repositories, playbookList, tasksTotal),
        [playbookList, repositories, tasksTotal],
    );

    const pendingPlaybook = useMemo(
        () => findPlaybookById(playbookList, pendingTask?.playbook_id),
        [pendingTask, playbookList],
    );

    return {
        displayTasks,
        executorType,
        expandedKeys,
        hasMore,
        handleScroll,
        initLoading,
        pendingPlaybook,
        pendingTask,
        playbookList,
        selectedTreeKey,
        setExecutorType,
        setExpandedKeys,
        setPendingTask,
        setSelectedTreeKey,
        setStatusFilter,
        setTaskSearch,
        statusFilter,
        taskSearch,
        tasksLoading,
        tasksTotal,
        treeData,
    };
};
