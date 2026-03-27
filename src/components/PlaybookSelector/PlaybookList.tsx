import React from 'react';
import { CheckCircleFilled, FileTextOutlined } from '@ant-design/icons';
import { Empty, Space, Spin, Tag } from 'antd';

interface PlaybookListProps {
    loadingRepos: boolean;
    filteredPlaybooks: AutoHealing.Playbook[];
    value?: string;
    reposMap: Record<string, string>;
    onSelect: (playbookId: string) => void;
}

const PlaybookList: React.FC<PlaybookListProps> = ({
    loadingRepos,
    filteredPlaybooks,
    value,
    reposMap,
    onSelect,
}) => {
    return (
        <Spin spinning={loadingRepos}>
            {filteredPlaybooks.length > 0 ? (
                <Space orientation="vertical" style={{ width: '100%' }} size={12}>
                    {filteredPlaybooks.map((record) => {
                        const isSelected = value === record.id;
                        return (
                            <div
                                key={record.id}
                                onClick={() => onSelect(record.id)}
                                style={{
                                    border: isSelected ? '1px solid #1890ff' : '1px dashed #d9d9d9',
                                    background: isSelected ? '#f0f9ff' : '#fff',
                                    padding: '16px 20px',
                                    cursor: 'pointer',
                                    borderRadius: 2,
                                    transition: 'all 0.2s',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    position: 'relative',
                                }}
                                onMouseEnter={(e) => {
                                    if (!isSelected) {
                                        e.currentTarget.style.borderColor = '#1890ff';
                                        e.currentTarget.style.background = '#fafafa';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!isSelected) {
                                        e.currentTarget.style.borderColor = '#d9d9d9';
                                        e.currentTarget.style.background = '#fff';
                                    }
                                }}
                            >
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                                        <FileTextOutlined style={{ marginRight: 8, color: '#595959', fontSize: 16 }} />
                                        <span style={{ fontWeight: 600, color: '#262626', fontSize: 15 }}>{record.name}</span>
                                        {record.variables && record.variables.length > 0 && (
                                            <Tag style={{ marginLeft: 12, border: 'none', background: '#f5f5f5', color: '#595959', fontSize: 12 }}>
                                                {record.variables.length} vars
                                            </Tag>
                                        )}
                                    </div>
                                    <div style={{ color: '#8c8c8c', fontSize: 13, marginBottom: 8, paddingLeft: 24 }}>
                                        {record.description || '暂无描述'}
                                    </div>
                                    <Space size={16} style={{ fontSize: 12, color: '#bfbfbf', paddingLeft: 24 }}>
                                        <span>ID: {record.id.slice(0, 8)}</span>
                                        <span>Repo: {reposMap[record.repository_id || ''] || 'Unknown'}</span>
                                    </Space>
                                </div>
                                {isSelected && (
                                    <div style={{ position: 'absolute', right: 20, top: '50%', transform: 'translateY(-50%)' }}>
                                        <CheckCircleFilled style={{ color: '#1890ff', fontSize: 20 }} />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </Space>
            ) : (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="未找到匹配项" style={{ marginTop: 80 }} />
            )}
        </Spin>
    );
};

export default PlaybookList;
