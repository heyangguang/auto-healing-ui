import {
    Avatar,
    Checkbox,
    Col,
    Empty,
    Input,
    Pagination,
    Row,
    Select,
    Space,
    Tag,
    Typography,
} from 'antd';
import {
    CodeOutlined,
    RocketOutlined,
    SearchOutlined,
    ThunderboltOutlined,
} from '@ant-design/icons';

const { Text } = Typography;

type FilterNotification = '' | 'yes' | 'no';

interface ScheduleTemplateSelectionProps {
    currentPage: number;
    filteredTemplates: AutoHealing.ExecutionTask[];
    filterExecutor: string;
    filterNotification: FilterNotification;
    onlyReady: boolean;
    pageSize: number;
    paginatedTemplates: AutoHealing.ExecutionTask[];
    searchText: string;
    onFilterExecutorChange: (value: string) => void;
    onFilterNotificationChange: (value: FilterNotification) => void;
    onOnlyReadyChange: (checked: boolean) => void;
    onPageChange: (page: number, pageSize: number) => void;
    onSearchTextChange: (value: string) => void;
    onSelectTemplate: (template: AutoHealing.ExecutionTask) => void;
}

const ScheduleTemplateSelection: React.FC<ScheduleTemplateSelectionProps> = ({
    currentPage,
    filteredTemplates,
    filterExecutor,
    filterNotification,
    onlyReady,
    pageSize,
    paginatedTemplates,
    searchText,
    onFilterExecutorChange,
    onFilterNotificationChange,
    onOnlyReadyChange,
    onPageChange,
    onSearchTextChange,
    onSelectTemplate,
}) => (
    <div className="template-form-cards" style={{ maxWidth: 1100 }}>
        <div className="template-form-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Space wrap>
                    <Input
                        placeholder="搜索名称 / Playbook / 描述..."
                        prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                        value={searchText}
                        onChange={(event) => onSearchTextChange(event.target.value)}
                        allowClear
                        style={{ width: 260 }}
                    />
                    <Select
                        placeholder="执行器"
                        allowClear
                        style={{ width: 120 }}
                        value={filterExecutor || undefined}
                        onChange={(value) => onFilterExecutorChange(value || '')}
                        options={[
                            { label: 'SSH/Local', value: 'local' },
                            { label: 'Docker', value: 'docker' },
                        ]}
                    />
                    <Select
                        placeholder="通知"
                        allowClear
                        style={{ width: 110 }}
                        value={filterNotification || undefined}
                        onChange={(value) => onFilterNotificationChange((value || '') as FilterNotification)}
                        options={[
                            { label: '已配置通知', value: 'yes' },
                            { label: '未配置通知', value: 'no' },
                        ]}
                    />
                    <Checkbox checked={onlyReady} onChange={(event) => onOnlyReadyChange(event.target.checked)}>
                        <Text type="secondary">仅就绪</Text>
                    </Checkbox>
                </Space>
                <output>{filteredTemplates.length} 个模板</output>
            </div>
        </div>

        <div className="template-form-card">
            <h4 className="template-form-section-title">
                <RocketOutlined />
                选择任务模板
                <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 400, color: '#8c8c8c' }}>
                    点击选择模板进入配置
                </span>
            </h4>

            {paginatedTemplates.length === 0 ? (
                <div className="template-form-var-empty">
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="没有匹配的模板" />
                </div>
            ) : (
                <Row gutter={[12, 12]}>
                    {paginatedTemplates.map((template) => {
                        const playbookKnownOffline = !!template.playbook && template.playbook.status !== 'ready';
                        return (
                            <Col key={template.id} xs={24} sm={12} md={8} lg={6}>
                                <button
                                    type="button"
                                    className="schedule-tpl-pick-card"
                                    onClick={() => onSelectTemplate(template)}
                                    onKeyDown={(event) => {
                                        if (event.key !== 'Enter' && event.key !== ' ') {
                                            return;
                                        }
                                        event.preventDefault();
                                        onSelectTemplate(template);
                                    }}
                                    style={{ width: '100%', textAlign: 'left', background: 'transparent' }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                        <Avatar
                                            size={28}
                                            style={{
                                                background: template.executor_type === 'docker' ? '#e6f7ff' : '#f6ffed',
                                                color: template.executor_type === 'docker' ? '#1890ff' : '#52c41a',
                                                flexShrink: 0,
                                            }}
                                            icon={template.executor_type === 'docker' ? <ThunderboltOutlined /> : <CodeOutlined />}
                                        />
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <Text strong ellipsis style={{ fontSize: 13 }}>
                                                {template.name}
                                            </Text>
                                        </div>
                                    </div>
                                    <Text type="secondary" ellipsis style={{ fontSize: 11, display: 'block', marginBottom: 6 }}>
                                        {template.playbook?.name || template.playbook_id?.slice(0, 8) || 'N/A'}
                                    </Text>
                                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                        <Tag style={{ fontSize: 10, margin: 0 }}>
                                            {template.executor_type === 'docker' ? 'Docker' : 'SSH/Local'}
                                        </Tag>
                                        {template.needs_review ? (
                                            <Tag color="warning" style={{ fontSize: 10, margin: 0 }}>
                                                待审核
                                            </Tag>
                                        ) : playbookKnownOffline ? (
                                            <Tag color="default" style={{ fontSize: 10, margin: 0 }}>
                                                离线
                                            </Tag>
                                        ) : (
                                            <Tag color="success" style={{ fontSize: 10, margin: 0 }}>
                                                就绪
                                            </Tag>
                                        )}
                                    </div>
                                </button>
                            </Col>
                        );
                    })}
                </Row>
            )}

            <div className="standard-table-footer">
                <Pagination
                    current={currentPage}
                    total={filteredTemplates.length}
                    pageSize={pageSize}
                    showTotal={(total) => `共 ${total} 条`}
                    showSizeChanger={{ showSearch: false }}
                    pageSizeOptions={[12, 24, 48]}
                    showQuickJumper
                    onChange={onPageChange}
                    onShowSizeChange={(_, size) => onPageChange(1, size)}
                />
            </div>
        </div>
    </div>
);

export default ScheduleTemplateSelection;
