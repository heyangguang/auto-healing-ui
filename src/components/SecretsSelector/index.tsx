import React, { useState, useMemo } from 'react';
import { Button, Input, Modal, Empty, Tag } from 'antd';
import { PlusOutlined, SearchOutlined, KeyOutlined, CloseOutlined, CheckOutlined } from '@ant-design/icons';

interface SecretsSelectorProps {
    value?: string[];
    onChange?: (value: string[]) => void;
    dataSource: AutoHealing.SecretsSource[];
}

const SecretsSelector: React.FC<SecretsSelectorProps> = ({ value = [], onChange, dataSource }) => {
    const [open, setOpen] = useState(false);
    const [searchText, setSearchText] = useState('');

    // Ensure value is array
    const selectedIds = Array.isArray(value) ? value : [];

    // Filter logic
    const filteredDataSource = useMemo(() => {
        if (!searchText) return dataSource;
        return dataSource.filter(s => s.name.toLowerCase().includes(searchText.toLowerCase()));
    }, [dataSource, searchText]);

    // Handle selection toggle
    const handleToggle = (id: string) => {
        const newIds = selectedIds.includes(id)
            ? selectedIds.filter(v => v !== id)
            : [...selectedIds, id];
        onChange?.(newIds);
    };

    // Handle remove
    const handleRemove = (id: string) => {
        const newValue = selectedIds.filter(v => v !== id);
        onChange?.(newValue);
    };

    const highlightRemoveButton = (event: React.MouseEvent<HTMLElement>, color: string) => {
        event.currentTarget.style.color = color;
    };

    const highlightRowBackground = (event: React.MouseEvent<HTMLDivElement>, color: string) => {
        event.currentTarget.style.background = color;
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {/* 1. Trigger (Button) */}
            <Button
                type="dashed"
                size="large"
                icon={<PlusOutlined />}
                style={{ width: '100%', textAlign: 'left', borderRadius: 0, borderColor: '#d9d9d9', color: '#595959', fontSize: 14 }}
                onClick={() => { setSearchText(''); setOpen(true); }}
            >
                点击选择密钥源 (已选 {selectedIds.length} 个)...
            </Button>

            {/* 2. Display Area (Dotted Box) */}
            {selectedIds.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {selectedIds.map(id => {
                        const item = dataSource.find(d => d.id === id);
                        if (!item) return null;
                        return (
                            <div
                                key={id}
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    padding: '4px 8px',
                                    border: '1px dashed #d9d9d9',
                                    borderRadius: 0,
                                    background: '#fafafa',
                                    fontSize: 12,
                                    color: '#595959',
                                    transition: 'all 0.2s',
                                    userSelect: 'none'
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.borderColor = '#fa8c16';
                                    e.currentTarget.style.background = '#fff7e6';
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.borderColor = '#d9d9d9';
                                    e.currentTarget.style.background = '#fafafa';
                                }}
                            >
                                <KeyOutlined style={{ marginRight: 6, color: '#fa8c16' }} />
                                <span style={{ fontWeight: 500, marginRight: 4 }}>{item.name}</span>

                                {/* Priority & Type */}
                                <span style={{ color: '#999', fontSize: 10, marginRight: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                                    {item.priority !== undefined && <Tag style={{ margin: 0, padding: '0 4px', fontSize: 10, lineHeight: '16px', borderRadius: 0 }} color="geekblue">P{item.priority}</Tag>}
                                    {item.auth_type === 'password' ? '密码' : '密钥'}
                                </span>

                                <CloseOutlined
                                    style={{ fontSize: 10, cursor: 'pointer', color: '#bfbfbf' }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleRemove(id);
                                    }}
                                    onMouseEnter={(event) => highlightRemoveButton(event, '#ff4d4f')}
                                    onMouseLeave={(event) => highlightRemoveButton(event, '#bfbfbf')}
                                />
                            </div>
                        );
                    })}
                </div>
            )}

            {/* 3. Selection Modal */}
            <Modal
                title="选择密钥源"
                open={open}
                onCancel={() => setOpen(false)}
                footer={null}
                width={600}
                destroyOnHidden
            >
                <Input
                    placeholder="搜索密钥源..."
                    prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                    value={searchText}
                    onChange={e => setSearchText(e.target.value)}
                    style={{ marginBottom: 16 }}
                    allowClear
                />
                <div style={{ maxHeight: 400, overflowY: 'auto', border: '1px solid #f0f0f0', borderRadius: 4 }}>
                    {filteredDataSource.length === 0 ? (
                        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="无匹配项" />
                    ) : (
                        filteredDataSource.map(s => {
                            const isSelected = selectedIds.includes(s.id);
                            return (
                                <div
                                    key={s.id}
                                    onClick={() => handleToggle(s.id)}
                                    style={{
                                        padding: '10px 16px',
                                        borderBottom: '1px solid #f0f0f0',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        background: isSelected ? '#fff7e6' : '#fff',
                                        transition: 'all 0.2s',
                                    }}
                                    onMouseEnter={(event) => {
                                        if (!isSelected) {
                                            highlightRowBackground(event, '#fafafa');
                                        }
                                    }}
                                    onMouseLeave={(event) => {
                                        if (!isSelected) {
                                            highlightRowBackground(event, '#fff');
                                        }
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                        <KeyOutlined style={{ marginRight: 10, color: isSelected ? '#fa8c16' : '#bfbfbf', fontSize: 16 }} />
                                        <div>
                                            <div style={{ fontWeight: isSelected ? 500 : 400, color: isSelected ? '#fa8c16' : '#262626' }}>{s.name}</div>
                                            <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>
                                                {s.auth_type === 'password' ? '密码认证' : 'SSH 密钥'}
                                                {s.priority !== undefined && ` · 优先级 P${s.priority}`}
                                            </div>
                                        </div>
                                    </div>
                                    {isSelected && <CheckOutlined style={{ color: '#fa8c16', fontSize: 16 }} />}
                                </div>
                            );
                        })
                    )}
                </div>
                <div style={{ marginTop: 16, textAlign: 'right', color: '#999', fontSize: 12 }}>
                    已选择 {selectedIds.length} 个密钥源
                    <Button type="primary" onClick={() => setOpen(false)} style={{ marginLeft: 12 }}>
                        确定
                    </Button>
                </div>
            </Modal>
        </div>
    );
};

export default SecretsSelector;
