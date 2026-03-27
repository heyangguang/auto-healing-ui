import React, { useMemo } from 'react';
import { Button, Empty, Pagination, Row, Spin, Tooltip, Typography } from 'antd';
import {
    CheckCircleOutlined,
    ExclamationCircleOutlined,
    ThunderboltOutlined,
    WarningOutlined,
    ClockCircleOutlined,
} from '@ant-design/icons';
import StandardTable from '@/components/StandardTable';
import type { AdvancedSearchField, SearchField } from '@/components/StandardTable';
import { getRunStatusOptions } from '@/constants/executionDicts';
import type { ExecutionStatsAvailability } from '../executePageHelpers';
import ExecuteLaunchpadCard from './ExecuteLaunchpadCard';

const { Text } = Typography;

interface LaunchpadStats {
    total: number;
    ready: number;
    needs_review: number;
    changed_playbooks: number;
    never_executed: number;
    last_run_failed: number;
}

interface SearchParams {
    searchField?: string;
    searchValue?: string;
    advancedSearch?: Record<string, unknown>;
    filters?: { field: string; value: string }[];
}

interface ExecuteLaunchpadProps {
    canCreateTask: boolean;
    currentPage: number;
    errorMessage?: string;
    filteredTemplates: AutoHealing.ExecutionTask[];
    initialized: boolean;
    loading: boolean;
    pageSize: number;
    stats: LaunchpadStats;
    statsAvailability: ExecutionStatsAvailability;
    totalTemplates: number;
    onPageChange: (page: number, size: number) => void;
    onPrimaryAction: () => void;
    onRetry: () => void;
    onSearch: (params: SearchParams) => void;
    onSelectTemplate: (template: AutoHealing.ExecutionTask) => void;
}

const ExecuteLaunchpad: React.FC<ExecuteLaunchpadProps> = ({
    canCreateTask,
    currentPage,
    errorMessage,
    filteredTemplates,
    initialized,
    loading,
    pageSize,
    stats,
    statsAvailability,
    totalTemplates,
    onPageChange,
    onPrimaryAction,
    onRetry,
    onSearch,
    onSelectTemplate,
}) => {
    const searchFields: SearchField[] = useMemo(() => [
        { key: 'name', label: '模板名称' },
        { key: 'playbook_name', label: 'Playbook 名称' },
        { key: 'target_hosts', label: '目标主机' },
        {
            key: '__enum__executor_type',
            label: '执行器类型',
            options: [
                { label: 'SSH / Local', value: 'local' },
                { label: 'Docker', value: 'docker' },
            ],
        },
        {
            key: '__enum__status',
            label: '模板状态',
            description: '筛选模板就绪/审核状态',
            options: [
                { label: '就绪', value: 'ready' },
                { label: '需审核', value: 'review' },
            ],
        },
        {
            key: '__enum__last_run_status',
            label: '最后执行状态',
            description: '按最后一次执行结果筛选',
            options: getRunStatusOptions().slice(0, 3),
        },
    ], []);

    const advancedSearchFields: AdvancedSearchField[] = useMemo(() => [
        { key: 'name', label: '模板名称', type: 'input', placeholder: '输入模板名称' },
        { key: 'playbook_name', label: 'Playbook 名称', type: 'input', placeholder: '输入 Playbook 名称' },
        { key: 'target_hosts', label: '目标主机', type: 'input', placeholder: '输入主机地址' },
        {
            key: 'needs_review',
            label: '审核状态',
            type: 'select',
            options: [
                { label: '需审核', value: 'true' },
                { label: '正常', value: 'false' },
            ],
        },
        {
            key: 'last_run_status',
            label: '最后执行状态',
            type: 'select',
            description: '按最后一次执行记录的状态筛选',
            options: getRunStatusOptions(),
        },
        {
            key: 'has_runs',
            label: '执行记录',
            type: 'select',
            description: '筛选是否有执行记录',
            options: [
                { label: '有执行记录', value: 'true' },
                { label: '无执行记录', value: 'false' },
            ],
        },
        { key: 'created_at', label: '创建时间', type: 'dateRange' },
    ], []);

    return (
        <StandardTable<AutoHealing.ExecutionTask>
            tabs={[{ key: 'launchpad', label: '任务列表' }]}
            title="任务执行"
            description={`${totalTemplates} 个任务模板 · 选择模板 → 配置参数 → 执行`}
            headerIcon={<ThunderboltOutlined style={{ fontSize: 28 }} />}
            headerExtra={
                <div className="template-stats-bar">
                    {[
                        {
                            icon: <CheckCircleOutlined />,
                            cls: 'total',
                            val: statsAvailability.ready ? stats.ready : '--',
                            lbl: '模板就绪',
                            tip: statsAvailability.ready ? `${stats.ready} 个模板状态为就绪` : undefined,
                        },
                        {
                            icon: <ExclamationCircleOutlined />,
                            cls: 'review',
                            val: statsAvailability.needs_review ? stats.needs_review : '--',
                            lbl: '待审核',
                            tip: statsAvailability.needs_review && stats.needs_review > 0
                                ? `${stats.needs_review} 个模板需审核（涉及 ${stats.changed_playbooks} 个 Playbook 变更）`
                                : undefined,
                        },
                        {
                            icon: <ClockCircleOutlined />,
                            cls: 'local',
                            val: statsAvailability.never_executed ? stats.never_executed : '--',
                            lbl: '从未执行',
                            tip: statsAvailability.never_executed && stats.never_executed > 0
                                ? `${stats.never_executed} 个模板创建后从未执行`
                                : undefined,
                        },
                        {
                            icon: <WarningOutlined />,
                            cls: 'failed',
                            val: statsAvailability.last_run_failed ? stats.last_run_failed : '--',
                            lbl: '最近失败',
                            tip: statsAvailability.last_run_failed && stats.last_run_failed > 0
                                ? `${stats.last_run_failed} 个模板最后一次执行失败`
                                : undefined,
                        },
                    ].map((item, index) => (
                        <React.Fragment key={item.cls}>
                            {index > 0 && <div className="template-stat-divider" />}
                            <Tooltip title={item.tip} placement="bottom">
                                <div className="template-stat-item" style={{ cursor: item.tip ? 'help' : undefined }}>
                                    <span className={`template-stat-icon template-stat-icon-${item.cls}`}>{item.icon}</span>
                                    <div className="template-stat-content">
                                        <div className="template-stat-value">{item.val}</div>
                                        <div className="template-stat-label">{item.lbl}</div>
                                    </div>
                                </div>
                            </Tooltip>
                        </React.Fragment>
                    ))}
                </div>
            }
            searchFields={searchFields}
            advancedSearchFields={advancedSearchFields}
            onSearch={onSearch}
            primaryActionLabel="新建模板"
            primaryActionDisabled={!canCreateTask}
            onPrimaryAction={onPrimaryAction}
        >
            {loading || !initialized ? (
                <div style={{ textAlign: 'center', padding: 80 }}>
                    <Spin size="large" tip="加载任务模板...">
                        <div />
                    </Spin>
                </div>
            ) : errorMessage ? (
                <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={<Text type="danger">{errorMessage}</Text>}
                >
                    <Button onClick={onRetry}>重试</Button>
                </Empty>
            ) : filteredTemplates.length === 0 ? (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={<Text type="secondary">没有可用的发射任务</Text>}>
                    <Button type="dashed" onClick={onPrimaryAction}>
                        创建新模板
                    </Button>
                </Empty>
            ) : (
                <>
                    <Row gutter={[20, 20]} className="launchpad-grid">
                        {filteredTemplates.map((template) => (
                            <ExecuteLaunchpadCard
                                key={template.id}
                                template={template}
                                onSelect={onSelectTemplate}
                            />
                        ))}
                    </Row>

                    <div className="launchpad-pagination">
                        <Pagination
                            current={currentPage}
                            total={totalTemplates}
                            pageSize={pageSize}
                            onChange={onPageChange}
                            showSizeChanger={{ showSearch: false }}
                            pageSizeOptions={['16', '24', '48']}
                            showQuickJumper
                            showTotal={(total) => `共 ${total} 条`}
                        />
                    </div>
                </>
            )}
        </StandardTable>
    );
};

export default ExecuteLaunchpad;
