import React, { useMemo } from 'react';
import { HistoryOutlined } from '@ant-design/icons';
import StandardTable from '@/components/StandardTable';
import SortToolbar from '@/components/SortToolbar';
import type { ProOptions } from 'reactflow';
import 'reactflow/dist/style.css';
import {
    advancedSearchFields,
    searchFields,
    SORT_OPTIONS,
} from './instanceQueryConfig';
import { InstanceListSidebar } from './InstanceListSidebar';
import { InstancePreviewPane } from './InstancePreviewPane';
import { InstanceStatsBar } from './InstanceStatsBar';
import { useInstanceListState } from './useInstanceListState';

import '../../../pages/execution/git-repos/index.css';
import './instances.css';

// Import node types
import ApprovalNode from '../flows/editor/ApprovalNode';
import ConditionNode from '../flows/editor/ConditionNode';
import CustomNode from '../flows/editor/CustomNode';
import EndNode from '../flows/editor/EndNode';
import ExecutionNode from '../flows/editor/ExecutionNode';
import StartNode from '../flows/editor/StartNode';

const nodeTypes = {
    start: StartNode,
    end: EndNode,
    host_extractor: CustomNode,
    cmdb_validator: CustomNode,
    approval: ApprovalNode,
    execution: ExecutionNode,
    notification: CustomNode,
    condition: ConditionNode,
    set_variable: CustomNode,
    compute: CustomNode,
    custom: CustomNode,
};

const PAGE_SIZE = 20;
const pageProOptions: ProOptions = { hideAttribution: true };

// ==================== 主组件 ====================
const InstanceList: React.FC = () => {
    const {
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
        proOptions,
        selectInstance,
        selectedInstanceId,
        selectedStatusConfig,
        setSortBy,
        setSortOrder,
        sortBy,
        sortOrder,
        stats,
    } = useInstanceListState({ pageSize: PAGE_SIZE });

    // ==================== Sort Toolbar ====================
    const sortToolbar = useMemo(() => (
        <SortToolbar
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSortByChange={setSortBy}
            onSortOrderChange={setSortOrder}
            options={SORT_OPTIONS}
        />
    ), [sortBy, sortOrder]);

    // ==================== 渲染 ====================
    return (
        <StandardTable<AutoHealing.FlowInstance>
                tabs={[{ key: 'list', label: '实例列表' }]}
                title="流程实例"
                description="自愈流程运行实例管理，可视化查看执行路径与节点状态"
                headerIcon={<HistoryOutlined style={{ fontSize: 28 }} />}
                headerExtra={<InstanceStatsBar stats={stats} />}
                searchFields={searchFields}
                advancedSearchFields={advancedSearchFields}
                onSearch={handleSearch}
                extraToolbarActions={sortToolbar}
            >
                {/* ===== 左右分栏: 列表(20%) + 画布(80%) ===== */}
                <div style={{ height: 'calc(100vh - 280px)', border: '1px solid #f0f0f0', display: 'flex', background: '#fff' }}>
                    <InstanceListSidebar
                        hasMore={hasMore}
                        instances={instances}
                        loading={loading}
                        onScroll={handleScroll}
                        onSelect={selectInstance}
                        selectedInstanceId={selectedInstanceId}
                    />

                    <InstancePreviewPane
                        detailLoading={detailLoading}
                        edges={edges}
                        handleAutoLayout={handleAutoLayout}
                        instanceDetail={instanceDetail}
                        nodeTypes={nodeTypes}
                        nodes={nodes}
                        onEdgesChange={onEdgesChange}
                        onNodeClick={onNodeClick}
                        onNodesChange={onNodesChange}
                        proOptions={proOptions || pageProOptions}
                        selectedInstanceId={selectedInstanceId}
                        selectedStatusConfig={selectedStatusConfig}
                    />
                </div>
            </StandardTable>
    );
};

export default InstanceList;
