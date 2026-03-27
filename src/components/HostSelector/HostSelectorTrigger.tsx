import React, { useMemo, useState } from 'react';
import { CloseOutlined, DesktopOutlined, PlusOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import { HOST_CHIP_MAX } from './constants';
import HostSelectorModal from './HostSelectorModal';
import type { HostSelectorProps } from './types';

const HostSelector: React.FC<HostSelectorProps> = ({ value, onChange, onChangeItems, excludeHosts = [] }) => {
    const [modalOpen, setModalOpen] = useState(false);

    const selectedHosts = useMemo((): string[] => {
        if (Array.isArray(value)) return value;
        if (typeof value === 'string' && value) return value.split(',').filter(Boolean);
        return [];
    }, [value]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Button
                type="dashed"
                size="large"
                onClick={() => setModalOpen(true)}
                icon={<PlusOutlined />}
                style={{ width: '100%', textAlign: 'left', borderColor: '#d9d9d9', color: '#595959', borderRadius: 0, fontSize: 14 }}
            >
                选择目标主机 ({selectedHosts.length}) ...
            </Button>

            {selectedHosts.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {selectedHosts.slice(0, HOST_CHIP_MAX).map((ip) => (
                        <div
                            key={ip}
                            style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 8px', border: '1px dashed #d9d9d9', borderRadius: 0, background: '#fafafa', fontSize: 12, color: '#595959', cursor: 'default', transition: 'all 0.2s' }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = '#ff4d4f';
                                e.currentTarget.style.color = '#ff4d4f';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = '#d9d9d9';
                                e.currentTarget.style.color = '#595959';
                            }}
                        >
                            <DesktopOutlined style={{ marginRight: 4, fontSize: 10 }} />
                            {ip}
                            <CloseOutlined
                                style={{ marginLeft: 8, fontSize: 10, cursor: 'pointer' }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onChange?.(selectedHosts.filter((host) => host !== ip));
                                }}
                            />
                        </div>
                    ))}
                    {selectedHosts.length > HOST_CHIP_MAX && <span style={{ color: '#999', fontSize: 12 }}>... 等 {selectedHosts.length} 台</span>}
                </div>
            )}

            <HostSelectorModal
                open={modalOpen}
                value={selectedHosts}
                excludeHosts={excludeHosts}
                onOk={(keys, items) => {
                    onChange?.(keys);
                    onChangeItems?.(items);
                    setModalOpen(false);
                }}
                onCancel={() => setModalOpen(false)}
            />
        </div>
    );
};

export default HostSelector;
