import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Col, Empty, Input, Modal, Row, Select, Space, Tag, Typography, message } from 'antd';
import { LoadingOutlined, SafetyCertificateOutlined, SearchOutlined } from '@ant-design/icons';
import { getCommandBlacklist, type CommandBlacklistRule } from '@/services/auto-healing/commandBlacklist';
import { createRequestSequence } from '@/utils/requestSequence';

const { Text } = Typography;

const PAGE_SIZE = 50;

const SEVERITY_COLORS: Record<CommandBlacklistRule['severity'], string> = {
    critical: 'red',
    high: 'orange',
    medium: 'gold',
};

const SEVERITY_LABELS: Record<CommandBlacklistRule['severity'], string> = {
    critical: '严重',
    high: '高危',
    medium: '中危',
};

type RuleQueryParams = {
    page: number;
    page_size: number;
    is_active: boolean;
    name?: string;
    severity?: CommandBlacklistRule['severity'];
};

interface ExemptionRuleSelectorProps {
    open: boolean;
    value?: string;
    onSelect: (id: string, rule: CommandBlacklistRule) => void;
    onCancel: () => void;
}

const ExemptionRuleSelector: React.FC<ExemptionRuleSelectorProps> = ({ open, value, onSelect, onCancel }) => {
    const [rules, setRules] = useState<CommandBlacklistRule[]>([]);
    const [loading, setLoading] = useState(false);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [search, setSearch] = useState('');
    const [severityFilter, setSeverityFilter] = useState<CommandBlacklistRule['severity']>();
    const [selectedRule, setSelectedRule] = useState<CommandBlacklistRule | null>(null);
    const [loadError, setLoadError] = useState<string | null>(null);
    const requestSequenceRef = useRef(createRequestSequence());
    const loadingRef = useRef(false);

    const loadRules = useCallback(async (pageNum: number, reset: boolean) => {
        if (loadingRef.current && !reset) {
            return;
        }

        const token = requestSequenceRef.current.next();
        loadingRef.current = true;
        setLoading(true);

        try {
            const params: RuleQueryParams = {
                page: pageNum,
                page_size: PAGE_SIZE,
                is_active: true,
            };

            if (search) {
                params.name = search;
            }
            if (severityFilter) {
                params.severity = severityFilter;
            }

            const response = await getCommandBlacklist(params);
            if (!requestSequenceRef.current.isCurrent(token)) {
                return;
            }

            setLoadError(null);
            const nextRules = response.data || [];
            const nextTotal = Number(response.total ?? 0);

            setRules((current) => (reset ? nextRules : [...current, ...nextRules]));
            setTotal(nextTotal);
            setPage(pageNum);
            setHasMore(pageNum * PAGE_SIZE < nextTotal);

            if (reset && value) {
                const matchedRule = nextRules.find((rule) => rule.id === value) ?? null;
                setSelectedRule(matchedRule);
            }
        } catch {
            if (requestSequenceRef.current.isCurrent(token)) {
                if (reset) {
                    setRules([]);
                    setTotal(0);
                    setPage(1);
                    setHasMore(true);
                    setSelectedRule(null);
                }
                setLoadError('加载黑名单规则失败，请稍后重试');
                message.error('加载黑名单规则失败，请稍后重试');
            }
        } finally {
            if (requestSequenceRef.current.isCurrent(token)) {
                loadingRef.current = false;
                setLoading(false);
            }
        }
    }, [search, severityFilter, value]);

    useEffect(() => {
        if (!open) {
            requestSequenceRef.current.invalidate();
            loadingRef.current = false;
            setLoading(false);
            return;
        }

        requestSequenceRef.current.invalidate();
        loadingRef.current = false;
        setLoading(false);
        setRules([]);
        setPage(1);
        setHasMore(true);
        setSearch('');
        setSeverityFilter(undefined);
        setSelectedRule(null);
        setLoadError(null);
    }, [open]);

    useEffect(() => {
        if (!open) {
            return undefined;
        }

        setSelectedRule(null);
        setRules([]);
        setTotal(0);
        setPage(1);
        setHasMore(true);

        const timer = window.setTimeout(() => {
            void loadRules(1, true);
        }, 300);

        return () => window.clearTimeout(timer);
    }, [loadRules, open, search, severityFilter]);

    const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop, clientHeight, scrollHeight } = event.currentTarget;
        if (scrollHeight - scrollTop - clientHeight < 100 && !loading && hasMore) {
            void loadRules(page + 1, false);
        }
    }, [hasMore, loadRules, loading, page]);

    return (
        <Modal
            title={<Space><SafetyCertificateOutlined /> 选择黑名单规则</Space>}
            open={open}
            onCancel={onCancel}
            onOk={() => selectedRule && onSelect(selectedRule.id, selectedRule)}
            okText="确定选择"
            okButtonProps={{ disabled: !selectedRule }}
            width={700}
            destroyOnHidden
        >
            <Row gutter={12} style={{ marginBottom: 16 }}>
                <Col span={14}>
                    <Input
                        placeholder="搜索规则名称"
                        prefix={<SearchOutlined />}
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        allowClear
                    />
                </Col>
                <Col span={10}>
                    <Select
                        placeholder="严重级别"
                        value={severityFilter}
                        onChange={setSeverityFilter}
                        allowClear
                        style={{ width: '100%' }}
                        options={[
                            { label: '严重', value: 'critical' },
                            { label: '高危', value: 'high' },
                            { label: '中危', value: 'medium' },
                        ]}
                    />
                </Col>
            </Row>

            <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
                <Text type="secondary" style={{ fontSize: 12 }}>仅显示已启用的规则</Text>
                <Text type="secondary" style={{ fontSize: 12 }}>共 {total} 条</Text>
            </div>

            <div style={{ height: 360, overflow: 'auto' }} onScroll={handleScroll}>
                {loadError && (
                    <Alert
                        title={loadError}
                        type="error"
                        showIcon
                        style={{ marginBottom: 12 }}
                    />
                )}
                {rules.length === 0 && !loading ? (
                    <Empty description="暂无匹配规则" style={{ marginTop: 80 }} />
                ) : (
                    <>
                        {rules.map((rule) => {
                            const isSelected = selectedRule?.id === rule.id;

                            return (
                                <div
                                    key={rule.id}
                                    onClick={() => setSelectedRule(rule)}
                                    style={{
                                        cursor: 'pointer',
                                        background: isSelected ? '#e6f7ff' : 'transparent',
                                        borderLeft: isSelected ? '3px solid #1890ff' : '3px solid transparent',
                                        padding: '10px 12px',
                                        marginBottom: 4,
                                        borderBottom: '1px solid #f0f0f0',
                                        transition: 'all 0.15s',
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                        <Tag color={SEVERITY_COLORS[rule.severity]} style={{ margin: 0 }}>
                                            {SEVERITY_LABELS[rule.severity]}
                                        </Tag>
                                        <Text strong style={{ fontSize: 13 }}>{rule.name}</Text>
                                        <Tag style={{ fontSize: 10, margin: 0 }}>{rule.match_type}</Tag>
                                    </div>
                                    <div style={{ marginLeft: 4 }}>
                                        <Text code style={{ fontSize: 11, color: '#595959' }}>{rule.pattern}</Text>
                                    </div>
                                    {rule.description && (
                                        <div style={{ marginTop: 4, marginLeft: 4 }}>
                                            <Text type="secondary" style={{ fontSize: 11 }}>{rule.description}</Text>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                        {loading && (
                            <div style={{ textAlign: 'center', padding: 12 }}>
                                <Space><LoadingOutlined /><Text type="secondary">加载中...</Text></Space>
                            </div>
                        )}
                        {!hasMore && rules.length > 0 && (
                            <div style={{ textAlign: 'center', padding: 8, color: '#ccc', fontSize: 12 }}>
                                已加载全部 {rules.length} 条规则
                            </div>
                        )}
                    </>
                )}
            </div>
        </Modal>
    );
};

export default ExemptionRuleSelector;
