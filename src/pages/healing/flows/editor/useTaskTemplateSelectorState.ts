import type { Dispatch, Key, MutableRefObject, UIEvent } from 'react';
import { useCallback, useEffect, useReducer, useRef } from 'react';
import { getExecutionTask } from '@/services/auto-healing/execution';
import { createRequestSequence } from '@/utils/requestSequence';
import {
  getCachedExecutionTaskInventory,
  getCachedGitRepoInventory,
  getCachedPlaybookInventory,
} from '@/utils/selectorInventoryCache';
import {
  filterTasksByTree,
  getDefaultExpandedKeys,
  isMultiPlaybookRepoSelection,
  isTaskSelectable,
} from './taskTemplateSelectorHelpers';
import type {
  LoadTasksOptions,
  SelectorAction,
  TaskPageState,
} from './taskTemplateSelectorStateHelpers';
import {
  createInitialState,
  EMPTY_INVENTORY,
  FILTER_DEBOUNCE_MS,
  fetchTaskPage,
  getFiltersSnapshot,
  reducer,
  SCROLL_THRESHOLD_PX,
} from './taskTemplateSelectorStateHelpers';
import type {
  TaskTemplate,
  TaskTemplateFilters,
  TaskTemplateInventory,
  TaskTemplateSelectorState,
  TaskTemplateStatusFilter,
} from './taskTemplateSelectorTypes';

interface UseTaskTemplateSelectorStateArgs {
  open: boolean;
  value?: string;
}

interface SelectorRefs {
  inventoryRef: MutableRefObject<TaskTemplateInventory>;
  filtersRef: MutableRefObject<TaskTemplateFilters>;
  selectedValueRef: MutableRefObject<string | undefined>;
  tasksLoadingRef: MutableRefObject<boolean>;
  tasksRequestSequenceRef: MutableRefObject<
    ReturnType<typeof createRequestSequence>
  >;
  baseDataSequenceRef: MutableRefObject<
    ReturnType<typeof createRequestSequence>
  >;
}

function useSelectorCore(value?: string) {
  const [state, dispatch] = useReducer(reducer, value, createInitialState);
  const inventoryRef = useRef<TaskTemplateInventory>(EMPTY_INVENTORY);
  const filtersRef = useRef<TaskTemplateFilters>(
    getFiltersSnapshot(createInitialState(value)),
  );
  const selectedValueRef = useRef<string | undefined>(value);
  const tasksLoadingRef = useRef(false);
  const tasksRequestSequenceRef = useRef(createRequestSequence());
  const baseDataSequenceRef = useRef(createRequestSequence());
  const refs = useRef<SelectorRefs>({
    inventoryRef,
    filtersRef,
    selectedValueRef,
    tasksLoadingRef,
    tasksRequestSequenceRef,
    baseDataSequenceRef,
  }).current;
  const patchState = useCallback(
    (patch: Partial<TaskTemplateSelectorState>) => {
      dispatch({ type: 'patch', patch });
    },
    [],
  );
  return { dispatch, patchState, refs, state };
}

function usePreselectedTaskSync(
  patchState: (patch: Partial<TaskTemplateSelectorState>) => void,
  dispatch: Dispatch<SelectorAction>,
  tasksRequestSequenceRef: SelectorRefs['tasksRequestSequenceRef'],
) {
  return useCallback(
    async (
      preselectedId: string | undefined,
      reset: boolean,
      pageState: TaskPageState,
      token: number,
    ) => {
      if (!reset || !preselectedId) {
        return;
      }
      const selectedFromPage = pageState.tasks.find(
        (task) => task.id === preselectedId,
      );
      if (selectedFromPage) {
        patchState({
          selectedTaskId: preselectedId,
          selectedTask: selectedFromPage,
        });
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
            tasks: [
              selectedTask,
              ...pageState.tasks.filter((task) => task.id !== selectedTask.id),
            ],
          },
        });
      } catch {
        // ignore invalid stale selection
      }
    },
    [dispatch, patchState, tasksRequestSequenceRef],
  );
}

function useTaskLoader(
  patchState: (patch: Partial<TaskTemplateSelectorState>) => void,
  dispatch: Dispatch<SelectorAction>,
  refs: SelectorRefs,
) {
  const syncPreselectedTask = usePreselectedTaskSync(
    patchState,
    dispatch,
    refs.tasksRequestSequenceRef,
  );
  return useCallback(
    async (pageNum: number, options: LoadTasksOptions = {}) => {
      if (refs.tasksLoadingRef.current && !options.reset) {
        return;
      }
      const inventory = options.inventory ?? refs.inventoryRef.current;
      const filters = options.filters ?? refs.filtersRef.current;
      const token = refs.tasksRequestSequenceRef.current.next();
      refs.tasksLoadingRef.current = true;
      patchState({ tasksLoading: true });
      try {
        const pageState = await fetchTaskPage(
          pageNum,
          filters,
          inventory,
          Boolean(options.forceRefresh),
        );
        if (!refs.tasksRequestSequenceRef.current.isCurrent(token)) {
          return;
        }
        dispatch({
          type:
            Boolean(options.reset) ||
            isMultiPlaybookRepoSelection(filters, inventory.playbooks)
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
    },
    [dispatch, patchState, refs, syncPreselectedTask],
  );
}

function useBaseDataLoader(
  patchState: (patch: Partial<TaskTemplateSelectorState>) => void,
  refs: SelectorRefs,
  loadTasks: (pageNum: number, options?: LoadTasksOptions) => Promise<void>,
) {
  return useCallback(
    async (forceRefresh: boolean = false) => {
      const token = refs.baseDataSequenceRef.current.next();
      patchState({ initLoading: true });
      try {
        const [inventoryTasks, playbooks, repositories] = await Promise.all([
          getCachedExecutionTaskInventory({ forceRefresh }),
          getCachedPlaybookInventory({ forceRefresh }),
          getCachedGitRepoInventory({ forceRefresh }),
        ]);
        if (!refs.baseDataSequenceRef.current.isCurrent(token)) {
          return;
        }
        const inventory = { inventoryTasks, repositories, playbooks };
        refs.inventoryRef.current = inventory;
        patchState({
          ...inventory,
          expandedKeys: getDefaultExpandedKeys(repositories),
        });
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
    },
    [loadTasks, patchState, refs],
  );
}

function useFiltersRefSync(
  state: TaskTemplateSelectorState,
  filtersRef: SelectorRefs['filtersRef'],
) {
  useEffect(() => {
    filtersRef.current = getFiltersSnapshot(state);
  }, [
    filtersRef,
    state.executorType,
    state.search,
    state.selectedTreeKey,
    state.statusFilter,
  ]);
}

function useSelectedValueSync(
  value: string | undefined,
  tasks: TaskTemplate[],
  selectedValueRef: SelectorRefs['selectedValueRef'],
  patchState: (patch: Partial<TaskTemplateSelectorState>) => void,
) {
  const previousValueRef = useRef<string | undefined>(value);

  useEffect(() => {
    const valueChanged = previousValueRef.current !== value;
    previousValueRef.current = value;
    selectedValueRef.current = value;

    if (!value) {
      if (valueChanged) {
        patchState({ selectedTaskId: undefined, selectedTask: null });
      }
      return;
    }

    const nextSelectedTask = tasks.find((task) => task.id === value) || null;
    patchState({ selectedTaskId: value, selectedTask: nextSelectedTask });
  }, [patchState, selectedValueRef, tasks, value]);
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
  }, [
    filters.executorType,
    filters.search,
    filters.selectedTreeKey,
    filters.statusFilter,
    initLoading,
    loadTasks,
    open,
  ]);
}

function useSelectorHandlers(
  state: TaskTemplateSelectorState,
  patchState: (patch: Partial<TaskTemplateSelectorState>) => void,
  loadBaseData: (forceRefresh?: boolean) => Promise<void>,
  loadTasks: (pageNum: number, options?: LoadTasksOptions) => Promise<void>,
) {
  const patchFilterState = useCallback(
    (patch: Partial<TaskTemplateSelectorState>) => {
      patchState({ tasksLoading: true, ...patch });
    },
    [patchState],
  );

  const handleScroll = useCallback(
    (event: UIEvent<HTMLDivElement>) => {
      const { scrollTop, clientHeight, scrollHeight } = event.currentTarget;
      const nearBottom =
        scrollHeight - scrollTop - clientHeight < SCROLL_THRESHOLD_PX;
      if (nearBottom && !state.tasksLoading && state.hasMore) {
        void loadTasks(state.page + 1);
      }
    },
    [loadTasks, state.hasMore, state.page, state.tasksLoading],
  );

  const handleTreeSelect = useCallback(
    (keys: Key[]) => {
      const selectedKey = keys[0];
      if (!selectedKey) {
        return;
      }
      const nextSelectedTreeKey = String(selectedKey);
      if (nextSelectedTreeKey === state.selectedTreeKey) {
        return;
      }
      patchFilterState({ selectedTreeKey: nextSelectedTreeKey });
    },
    [patchFilterState, state.selectedTreeKey],
  );

  const handleTaskSelect = useCallback(
    (task: TaskTemplate) => {
      if (isTaskSelectable(task)) {
        patchState({ selectedTaskId: task.id, selectedTask: task });
      }
    },
    [patchState],
  );

  return {
    handleScroll,
    handleTaskSelect,
    handleTreeSelect,
    refresh: useCallback(() => {
      void loadBaseData(true);
    }, [loadBaseData]),
    setExecutorType: useCallback(
      (executorType?: string) => {
        if (executorType === state.executorType) {
          return;
        }
        patchFilterState({ executorType });
      },
      [patchFilterState, state.executorType],
    ),
    setExpandedKeys: useCallback(
      (expandedKeys: string[]) => {
        patchState({ expandedKeys });
      },
      [patchState],
    ),
    setSearch: useCallback(
      (search: string) => {
        if (search === state.search) {
          return;
        }
        patchFilterState({ search });
      },
      [patchFilterState, state.search],
    ),
    setStatusFilter: useCallback(
      (statusFilter?: TaskTemplateStatusFilter) => {
        if (statusFilter === state.statusFilter) {
          return;
        }
        patchFilterState({ statusFilter });
      },
      [patchFilterState, state.statusFilter],
    ),
  };
}

export function useTaskTemplateSelectorState({
  open,
  value,
}: UseTaskTemplateSelectorStateArgs) {
  const { state, dispatch, patchState, refs } = useSelectorCore(value);
  const loadTasks = useTaskLoader(patchState, dispatch, refs);
  const loadBaseData = useBaseDataLoader(patchState, refs, loadTasks);
  const filters = getFiltersSnapshot(state);

  useFiltersRefSync(state, refs.filtersRef);
  useSelectedValueSync(value, state.tasks, refs.selectedValueRef, patchState);
  useOpenStateSync(open, value, dispatch, refs, loadBaseData);
  useFilterReload(open, state.initLoading, filters, loadTasks);

  return {
    ...state,
    ...useSelectorHandlers(state, patchState, loadBaseData, loadTasks),
    canConfirm: Boolean(
      state.selectedTaskId && state.selectedTask && !state.initLoading,
    ),
    displayTasks: filterTasksByTree(
      state.tasks,
      state.selectedTreeKey,
      state.playbooks,
    ).filter(
      (task) => state.statusFilter === 'review' || isTaskSelectable(task),
    ),
  };
}
