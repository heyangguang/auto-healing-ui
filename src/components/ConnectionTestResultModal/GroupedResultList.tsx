import React from 'react';
import { Table, Tag, Typography } from 'antd';
import { CheckCircleFilled, CloseCircleFilled, DownOutlined, RightOutlined } from '@ant-design/icons';
import { getGroupColumns } from './groupColumns';
import type { AggregatedGroup } from './types';

const { Text } = Typography;

interface GroupedResultListProps {
    groups: AggregatedGroup[];
    expandedKeys: Set<string>;
    onToggleExpand: (key: string) => void;
    styles: Record<string, string>;
}

const GroupedResultList: React.FC<GroupedResultListProps> = ({
    groups,
    expandedKeys,
    onToggleExpand,
    styles,
}) => {
    return (
        <div className={styles.groupContainer} style={{ maxHeight: 420, overflow: 'auto' }}>
            {groups.map((group, idx) => {
                const expanded = expandedKeys.has(group.key);
                const isSuccess = group.type === 'success';

                return (
                    <div key={group.key} className={idx > 0 ? styles.errorGroupDivider : ''}>
                        <div
                            className={styles.groupHeader}
                            onClick={() => onToggleExpand(group.key)}
                            style={{ background: expanded ? (isSuccess ? '#f6ffed' : '#fff2f0') : undefined }}
                        >
                            <div className={styles.groupHeaderLeft}>
                                {expanded
                                    ? <DownOutlined style={{ fontSize: 10, color: '#8c8c8c' }} />
                                    : <RightOutlined style={{ fontSize: 10, color: '#8c8c8c' }} />}
                                {isSuccess
                                    ? <CheckCircleFilled style={{ color: '#52c41a', fontSize: 14 }} />
                                    : <CloseCircleFilled style={{ color: '#ff4d4f', fontSize: 14 }} />}
                                <Text
                                    ellipsis={{ tooltip: group.label }}
                                    style={{ fontSize: 13, fontWeight: 500, color: isSuccess ? '#389e0d' : '#cf1322' }}
                                >
                                    {group.label}
                                </Text>
                            </div>
                            <div className={styles.groupHeaderRight}>
                                <Tag
                                    color={isSuccess ? 'green' : 'red'}
                                    style={{ margin: 0, fontSize: 11, lineHeight: '18px', padding: '0 6px' }}
                                >
                                    {group.count} 台
                                </Tag>
                            </div>
                        </div>
                        {expanded && (
                            <div className={styles.groupBody}>
                                <Table
                                    dataSource={group.hosts}
                                    columns={getGroupColumns(isSuccess)}
                                    rowKey={(r) => `${r.cmdb_id}-${r.host}`}
                                    pagination={false}
                                    size="small"
                                    showHeader
                                    scroll={{ y: 240 }}
                                    style={{ background: '#fafafa' }}
                                />
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default GroupedResultList;
