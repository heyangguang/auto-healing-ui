import { useCallback, useEffect, useReducer, useRef } from 'react';
import type { Dispatch, Key, MutableRefObject, UIEvent } from 'react';
import { getExecutionTask } from '@/services/auto-healing/execution';
import { createRequestSequence } from '@/utils/requestSequence';
import { getCachedGitRepoInventory, getCachedPlaybookInventory } from '@/utils/selectorInventoryCache';
import { filterTasksByTree, getDefaultExpandedKeys, isMultiPlaybookRepoSelection } from './taskTemplateSelectorHelpers';
import { createInitialState, EMPTY_INVENTORY, fetchTaskPage, FILTER_DEBOUNCE_MS, getFiltersSnapshot, reducer, SCROLL_THRESHOLD_PX } from './taskTemplateSelectorStateHelpers';
import type { LoadTasksOptions, SelectorAction, TaskPageState } from './taskTemplateSelectorStateHelpers';
import type { TaskTemplate, TaskTemplateFilters, TaskTemplateInventory, TaskTemplateSelectorState, TaskTemplateStatusFilter } from './taskTemplateSelectorTypes';

interface UseTaskTemplateSelectorStateArgs {
    open: boolean;
    value?: string;
}

interface SelectorRefs {
    inventoryRef: MutableRefObject<TaskTemplateInventory>;
    filtersRef: MutableRefObject<TaskTemplateFilters>;
    selectedValueRef: MutableRefObject<string | undefined>;
    tasksLoadingRef: MutableRefObject<boolean>;
    tasksRequestSequenceRef: MutableRefObject<ReturnType<typeof createRequestSequence>>;
    baseDataSequenceRef: MutableRefObject<ReturnType<typeof createRequestSequence>>;
}

function useSelectorCore(value?: string) {
    const [state, dispatch] = useReducer(reducer, value, createInitialState);
    const refs: SelectorRefs = {
        inventoryRef: useRef<TaskTemplateInventory>(EMPTY_INVENTORY),
        filtersRef: useRef<TaskTemplateFilters>(getFiltersSnapshot(createInitialState(value))),
        selectedValueRef: useRef<string | undefined>(value),
        tasksLoadingRef: useRef(false),
        tasksRequestSequenceRef: useRef(createRequestSequence()),
        baseDataSequenceRef: useRef(createRequestSequence()),
    };
    const patchState = useCallback((patch: Partial<TaskTemplateSelectorState>) => { dispatch({ type: 'patch', patch }); }, []);
    return { dispatch, patchState, refs, state };
}

function usePreselectedTaskSync(
    patchState: (patch: Partial<TaskTemplateSelectorState>) => void,
    dispatch: Dispatch<SelectorAction>,
    tasksRequestSequenceRef: SelectorRefs['tasksRequestSequenceRef'],
) {
    return useCallback(async (
        preselectedId: string | undefined,
        reset: boolean,
        pageState: TaskPageState,
        token: number,
    ) => {
        if (!reset || !preselectedId) {
            return;
        }
        const selectedFromPage = pageState.tasks.find((task) => task.id === preselectedId);
        if (selectedFromPage) {
            patchState({ selectedTaskId: preselectedId, selectedTask: selectedFromPage });
            return;
        }
        try {
            const detail = await getExecutionTask(preselectedId);
            if (!tasksRequestSequenceRef.current.isCurrent(token)) {
                return;
            }
            const selectedTask = detail?.data || null;
            if (!selectedTask?.id) {
                return;
            }
            patchState({ selectedTaskId: selectedTask.id, selectedTask });
            dispatch({
                type: 'replaceTasks',
                payload: {
                    ...pageState,
                    tasks: [selectedTask, ...pageState.tasks.filter((task) => task.id !== selectedTask.id)],
                },
            });
        } catch {
            // ignore invalid stale selection
        }
    }, [dispatch, patchState, tasksRequestSequenceRef]);
}

function useTaskLoader(
    patchState: (patch: Partial<TaskTemplateSelectorState>) => void,
    dispatch: Dispatch<SelectorAction>,
    refs: SelectorRefs,
) {
    const syncPreselectedTask = usePreselectedTaskSync(patchState, dispatch, refs.tasksRequestSequenceRef);
    return useCallback(async (pageNum: number, options: LoadTasksOptions = {}) => {
        if (refs.tasksLoadingRef.current && !options.reset) {
            return;
        }
        const inventory = options.inventory ?? refs.inventoryRef.current;
        const filters = options.filters ?? refs.filtersRef.current;
        const token = refs.tasksRequestSequenceRef.current.next();
        refs.tasksLoadingRef.current = true;
        patchState({ tasksLoading: true });
        try {
            const pageState = await fetchTaskPage(pageNum, filters, inventory, Boolean(options.forceRefresh));
            if (!refs.tasksRequestSequenceRef.current.isCurrent(token)) {
                return;
            }
            dispatch({
                type: Boolean(options.reset) || isMultiPlaybookRepoSelection(filters, inventory.playbooks)
                    ? 'replaceTasks'
                    : 'appendTasks',
                payload: pageState,
            });
            await syncPreselectedTask(
                options.preselectedId ?? refs.selectedValueRef.current,
                Boolean(options.reset),
                pageState,
                token,
            );
        } catch (error) {
            console.error('Failed to load tasks:', error);
        } finally {
            if (refs.tasksRequestSequenceRef.current.isCurrent(token)) {
                refs.tasksLoadingRef.current = false;
                patchState({ tasksLoading: false });
            }
        }
    }, [dispatch, patchState, refs, syncPreselectedTask]);
}

function useBaseDataLoader(
    patchState: (patch: Partial<TaskTemplateSelectorState>) => void,
    refs: SelectorRefs,
    loadTasks: (pageNum: number, options?: LoadTasksOptions) => Promise<void>,
) {
    return useCallback(async (forceRefresh: boolean = false) => {
        const token = refs.baseDataSequenceRef.current.next();
        patchState({ initLoading: true });
        try {
            const [playbooks, repositories] = await Promise.all([
                getCachedPlaybookInventory({ forceRefresh }),
                getCachedGitRepoInventory({ forceRefresh }),
            ]);
            if (!refs.baseDataSequenceRef.current.isCurrent(token)) {
                return;
            }
            const inventory = { repositories, playbooks };
            refs.inventoryRef.current = inventory;
            patchState({ ...inventory, expandedKeys: getDefaultExpandedKeys(repositories) });
            await loadTasks(1, {
                reset: true,
                forceRefresh,
                inventory,
                filters: refs.filtersRef.current,
                preselectedId: refs.selectedValueRef.current,
            });
        } catch (error) {
            console.error('Failed to load base data:', error);
        } finally {
            if (refs.baseDataSequenceRef.current.isCurrent(token)) {
                patchState({ initLoading: false });
            }
        }
    }, [loadTasks, patchState, refs]);
}

function useFiltersRefSync(state: TaskTemplateSelectorState, filtersRef: SelectorRefs['filtersRef']) {
    useEffect(() => {
        filtersRef.current = getFiltersSnapshot(state);
    }, [filtersRef, state.executorType, state.search, state.selectedTreeKey, state.statusFilter]);
}

function useSelectedValueSync(
    value: string | undefined,
    state: TaskTemplateSelectorState,
    selectedValueRef: SelectorRefs['selectedValueRef'],
    patchState: (patch: Partial<TaskTemplateSelectorState>) => void,
) {
    useEffect(() => {
        selectedValueRef.current = value;
        const matchedTask = value ? state.tasks.find((task) => task.id === value) || null : null;
        const nextSelectedTask = matchedTask || (state.selectedTask?.id === value ? state.selectedTask : null);
        if (state.selectedTaskId === value && state.selectedTask === nextSelectedTask) {
            return;
        }
        patchState({ selectedTaskId: value, selectedTask: nextSelectedTask });
    }, [patchState, selectedValueRef, state.selectedTask, state.selectedTaskId, state.tasks, value]);
}

function useOpenStateSync(
    open: boolean,
    value: string | undefined,
    dispatch: Dispatch<SelectorAction>,
    refs: SelectorRefs,
    loadBaseData: (forceRefresh?: boolean) => Promise<void>,
) {
    useEffect(() => {
        if (open) {
            void loadBaseData();
            return;
        }
        refs.tasksRequestSequenceRef.current.invalidate();
        refs.baseDataSequenceRef.current.invalidate();
        refs.tasksLoadingRef.current = false;
        refs.inventoryRef.current = EMPTY_INVENTORY;
        refs.filtersRef.current = getFiltersSnapshot(createInitialState(value));
        dispatch({ type: 'reset', value });
    }, [dispatch, loadBaseData, open, refs, value]);
}

function useFilterReload(
    open: boolean,
    initLoading: boolean,
    filters: TaskTemplateFilters,
    loadTasks: (pageNum: number, options?: LoadTasksOptions) => Promise<void>,
) {
    useEffect(() => {
        if (!open || initLoading) {
            return undefined;
        }
        const timer = setTimeout(() => {
            void loadTasks(1, { reset: true });
        }, FILTER_DEBOUNCE_MS);
        return () => clearTimeout(timer);
    }, [filters.executorType, filters.search, filters.selectedTreeKey, filters.statusFilter, initLoading, loadTasks, open]);
}

function useSelectorHandlers(
    state: TaskTemplateSelectorState,
    patchState: (patch: Partial<TaskTemplateSelectorState>) => void,
    loadBaseData: (forceRefresh?: boolean) => Promise<void>,
    loadTasks: (pageNum: number, options?: LoadTasksOptions) => Promise<void>,
) {
    const handleScroll = useCallback((event: UIEvent<HTMLDivElement>) => {
        const { scrollTop, clientHeight, scrollHeight } = event.currentTarget;
        const nearBottom = scrollHeight - scrollTop - clientHeight < SCROLL_THRESHOLD_PX;
        if (nearBottom && !state.tasksLoading && state.hasMore) {
            void loadTasks(state.page + 1);
        }
    }, [loadTasks, state.hasMore, state.page, state.tasksLoading]);
    const handleTreeSelect = useCallback((keys: Key[]) => {
        const selectedKey = keys[0];
        if (selectedKey) {
            patchState({ selectedTreeKey: String(selectedKey) });
        }
    }, [patchState]);

    const handleTaskSelect = useCallback((task: TaskTemplate) => {
        if (!task.needs_review) {
            patchState({ selectedTaskId: task.id, selectedTask: task });
        }
    }, [patchState]);

    return {
        handleScroll,
        handleTaskSelect,
        handleTreeSelect,
        refresh: useCallback(() => { void loadBaseData(true); }, [loadBaseData]),
        setExecutorType: useCallback((executorType?: string) => { patchState({ executorType }); }, [patchState]),
        setExpandedKeys: useCallback((expandedKeys: string[]) => { patchState({ expandedKeys }); }, [patchState]),
        setSearch: useCallback((search: string) => { patchState({ search }); }, [patchState]),
        setStatusFilter: useCallback((statusFilter?: TaskTemplateStatusFilter) => {
            patchState({ statusFilter });
        }, [patchState]),
    };
}

export function useTaskTemplateSelectorState({ open, value }: UseTaskTemplateSelectorStateArgs) {
    const { state, dispatch, patchState, refs } = useSelectorCore(value);
    const loadTasks = useTaskLoader(patchState, dispatch, refs);
    const loadBaseData = useBaseDataLoader(patchState, refs, loadTasks);
    const filters = getFiltersSnapshot(state);

    useFiltersRefSync(state, refs.filtersRef);
    useSelectedValueSync(value, state, refs.selectedValueRef, patchState);
    useOpenStateSync(open, value, dispatch, refs, loadBaseData);
    useFilterReload(open, state.initLoading, filters, loadTasks);

    return {
        ...state,
        ...useSelectorHandlers(state, patchState, loadBaseData, loadTasks),
        canConfirm: Boolean(state.selectedTaskId && state.selectedTask && !state.initLoading),
        displayTasks: filterTasksByTree(state.tasks, state.selectedTreeKey, state.playbooks),
    };
}
