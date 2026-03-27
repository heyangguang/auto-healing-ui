import React from 'react';
import { Badge, Empty, Spin, Tag, Typography } from 'antd';
import { EVENT_TYPE_CONFIG } from './notificationTemplateConstants';

const { Text } = Typography;

type TemplateSidebarProps = {
    hasMore: boolean;
    loading: boolean;
    loadingMore: boolean;
    onLoadMore: () => void;
    onSelect: (id: string) => void;
    selectedId: string | null;
    templates: AutoHealing.NotificationTemplate[];
    width: number;
};

const TemplateSidebar: React.FC<TemplateSidebarProps> = ({
    hasMore,
    loading,
    loadingMore,
    onLoadMore,
    onSelect,
    selectedId,
    templates,
    width,
}) => (
    <div className="templates-sidebar" style={{ width, minWidth: width }}>
        <div
            className="templates-sidebar-list"
            onScroll={(event) => {
                const target = event.target as HTMLDivElement;
                if (target.scrollHeight - target.scrollTop - target.clientHeight < 100) {
                    onLoadMore();
                }
            }}
            style={{ height: '100%' }}
        >
            {loading ? (
                <div style={{ padding: 20, textAlign: 'center' }}><Spin /></div>
            ) : templates.length > 0 ? (
                <>
                    <div>
                        {templates.map((template) => {
                            const typeConfig = EVENT_TYPE_CONFIG[template.event_type] || {};
                            const isSelected = template.id === selectedId;

                            return (
                                <div
                                    key={template.id}
                                    className={`templates-sidebar-item ${isSelected ? 'templates-sidebar-item-selected' : ''}`}
                                    onClick={() => onSelect(template.id)}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                                        <Text
                                            ellipsis
                                            strong
                                            style={{ color: isSelected ? '#1890ff' : '#262626', maxWidth: 180 }}
                                        >
                                            {template.name}
                                        </Text>
                                        <Badge status={template.is_active ? 'processing' : 'default'} />
                                    </div>
                                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                        {typeConfig.icon && (
                                            <span style={{ color: typeConfig.color, fontSize: 12 }}>{typeConfig.icon}</span>
                                        )}
                                        <Tag style={{ margin: 0, fontSize: 10, padding: '0 4px' }} variant="filled">
                                            {typeConfig.label || template.event_type}
                                        </Tag>
                                        <Tag color="default" style={{ margin: 0, fontSize: 10, padding: '0 4px' }} variant="filled">
                                            {template.format}
                                        </Tag>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    {loadingMore && <div style={{ padding: 12, textAlign: 'center' }}><Spin size="small" /></div>}
                    {!hasMore && (
                        <div className="templates-sidebar-footer">
                            已加载全部 {templates.length} 个模板
                        </div>
                    )}
                </>
            ) : (
                <Empty description="暂无匹配的模板" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ marginTop: 60 }} />
            )}
        </div>
    </div>
);

export default TemplateSidebar;
