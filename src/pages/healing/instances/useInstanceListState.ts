import { history } from '@umijs/max';
import { startTransition, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useEdgesState, useNodesState, type Node, type ProOptions } from 'reactflow';
import { getHealingInstanceDetail, getHealingInstanceStats, getHealingInstances } from '@/services/auto-healing/instances';
import { buildCanvasElements } from './utils/canvasBuilder';
import { getLayoutedElements } from './utils/layoutUtils';
import { buildInstanceQueryParams, mergeInstanceSearchParams, type InstanceSearchParams, type InstanceSearchRequest } from './instanceQueryConfig';
import { getInstanceStatusConfig } from './instanceStatus';

type UseInstanceListStateOptions = {
  pageSize: number;
};

const proOptions: ProOptions = { hideAttribution: true };

export const useInstanceListState = ({ pageSize }: UseInstanceListStateOptions) => {
  const [instances, setInstances] = useState<AutoHealing.FlowInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [stats, setStats] = useState<{
    total: number;
    by_status: { status: string; count: number }[];
  } | null>(null);
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | undefined>(undefined);
  const [instanceDetail, setInstanceDetail] = useState<AutoHealing.FlowInstance | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailRefreshKey, setDetailRefreshKey] = useState(0);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const searchParamsRef = useRef<InstanceSearchParams>({});
  const listRequestSequenceRef = useRef(0);
  const detailRequestSequenceRef = useRef(0);

  const buildApiParams = useCallback((searchParams: InstanceSearchParams, currentPage: number) => (
    buildInstanceQueryParams(searchParams, currentPage, pageSize, sortBy, sortOrder)
  ), [pageSize, sortBy, sortOrder]);

  const loadStats = useCallback(async () => {
    try {
      const response = await getHealingInstanceStats();
      setStats(response?.data || null);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  const clearSelectedInstance = useCallback(() => {
    setSelectedInstanceId(undefined);
    setInstanceDetail(null);
    setNodes([]);
    setEdges([]);
  }, [setEdges, setNodes]);

  const selectInstance = useCallback((instanceId?: string) => {
    setSelectedInstanceId((previous) => {
      if (previous === instanceId) {
        setDetailRefreshKey((count) => count + 1);
      }
      return instanceId;
    });
  }, []);

  const applyResetResult = useCallback((data: AutoHealing.FlowInstance[]) => {
    setInstances(data);
    if (data.length === 0) {
      clearSelectedInstance();
      return;
    }
    selectInstance(data[0]?.id);
  }, [clearSelectedInstance, selectInstance]);

  const loadInstances = useCallback(async (
    currentPage: number,
    isReset: boolean,
    overrideSearchParams?: InstanceSearchParams,
  ) => {
    const requestSequence = listRequestSequenceRef.current + 1;
    listRequestSequenceRef.current = requestSequence;
    setLoading(true);
    try {
      const params = buildApiParams(overrideSearchParams || searchParamsRef.current, currentPage);
      const response = await getHealingInstances(params);
      if (requestSequence !== listRequestSequenceRef.current) {
        return;
      }

      const data = response.data || [];
      if (isReset) {
        applyResetResult(data);
      } else {
        setInstances((previous) => [
          ...previous,
          ...data.filter((item) => !previous.some((existing) => existing.id === item.id)),
        ]);
      }

      setHasMore(data.length === pageSize);
      setPage(currentPage);
      setTotal(response.total || data.length);
    } catch {
      if (requestSequence !== listRequestSequenceRef.current) {
        return;
      }

      if (isReset) {
        setInstances([]);
        setTotal(0);
        setHasMore(false);
        clearSelectedInstance();
      }
    } finally {
      if (requestSequence === listRequestSequenceRef.current) {
        setLoading(false);
      }
    }
  }, [applyResetResult, buildApiParams, clearSelectedInstance, pageSize]);

  useEffect(() => {
    void loadInstances(1, true);
  }, [loadInstances]);

  const handleSearch = useCallback((params: InstanceSearchRequest) => {
    const merged = mergeInstanceSearchParams(params);
    searchParamsRef.current = merged;
    setPage(1);
    void loadInstances(1, true, merged);
  }, [loadInstances]);

  useEffect(() => {
    if (!selectedInstanceId) {
      detailRequestSequenceRef.current += 1;
      setInstanceDetail(null);
      setNodes([]);
      setEdges([]);
      setDetailLoading(false);
      return;
    }

    const requestSequence = detailRequestSequenceRef.current + 1;
    detailRequestSequenceRef.current = requestSequence;
    setDetailLoading(true);
    setInstanceDetail(null);
    setNodes([]);
    setEdges([]);

    void getHealingInstanceDetail(selectedInstanceId)
      .then((response) => {
        if (requestSequence !== detailRequestSequenceRef.current) {
          return;
        }

        const data = response?.data || response;
        startTransition(() => {
          setInstanceDetail(data);
        });

        if (!data?.flow_nodes || !data?.flow_edges) {
          startTransition(() => {
            setNodes([]);
            setEdges([]);
          });
          return;
        }

        const { nodes: builtNodes, edges: builtEdges } = buildCanvasElements({
          flowNodes: data.flow_nodes,
          flowEdges: data.flow_edges,
          nodeStates: data.node_states || {},
          currentNodeId: data.current_node_id,
          rule: data.rule,
        });

        const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(builtNodes, builtEdges);
        startTransition(() => {
          setNodes(layoutedNodes);
          setEdges(layoutedEdges);
        });
      })
      .catch(() => {
        if (requestSequence !== detailRequestSequenceRef.current) {
          return;
        }
        startTransition(() => {
          setInstanceDetail(null);
          setNodes([]);
          setEdges([]);
        });
      })
      .finally(() => {
        if (requestSequence === detailRequestSequenceRef.current) {
          startTransition(() => {
            setDetailLoading(false);
          });
        }
      });
  }, [detailRefreshKey, selectedInstanceId, setEdges, setNodes]);

  const handleAutoLayout = useCallback(() => {
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      nodes.map((node) => ({ ...node })),
      edges.map((edge) => ({ ...edge })),
      'TB',
      true,
    );
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [edges, nodes, setEdges, setNodes]);

  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, clientHeight, scrollHeight } = event.currentTarget;
    if (scrollHeight - scrollTop - clientHeight < 50 && hasMore && !loading) {
      void loadInstances(page + 1, false);
    }
  }, [hasMore, loadInstances, loading, page]);

  const onNodeClick = useCallback((_event: React.MouseEvent, _node: Node) => {
    if (selectedInstanceId) {
      history.push(`/healing/instances/${selectedInstanceId}`);
    }
  }, [selectedInstanceId]);

  const selectedStatusConfig = useMemo(
    () => (instanceDetail ? getInstanceStatusConfig(instanceDetail.status) : null),
    [instanceDetail],
  );

  return {
    detailLoading,
    edges,
    handleAutoLayout,
    handleScroll,
    handleSearch,
    hasMore,
    instanceDetail,
    instances,
    loading,
    nodes,
    onEdgesChange,
    onNodeClick,
    onNodesChange,
    page,
    proOptions,
    selectInstance,
    selectedInstanceId,
    selectedStatusConfig,
    setSortBy,
    setSortOrder,
    sortBy,
    sortOrder,
    stats,
  };
};
