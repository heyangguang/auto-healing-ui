import React from 'react';
import { LinkOutlined } from '@ant-design/icons';
import { Tag, Typography } from 'antd';

const { Text } = Typography;

export default function SecretsSourceConnectionConfigCard({ currentSource }: { currentSource: AutoHealing.SecretsSource }) {
    const vaultAuthType = currentSource.config?.auth?.type || 'token';

    return (
        <div className="secrets-detail-card">
            <div className="secrets-detail-card-header">
                <LinkOutlined className="secrets-detail-card-header-icon" />
                <span className="secrets-detail-card-header-title">连接配置</span>
            </div>
            <div className="secrets-detail-card-body">
                <div className="secrets-detail-grid">
                    {currentSource.type === 'file' && (
                        <>
                            <div className="secrets-detail-field" style={{ gridColumn: '1 / -1' }}>
                                <span className="secrets-detail-field-label">文件路径</span>
                                <div className="secrets-detail-field-value"><Text code copyable>{currentSource.config?.path || currentSource.config?.key_path || '-'}</Text></div>
                            </div>
                            <div className="secrets-detail-field">
                                <span className="secrets-detail-field-label">默认用户名</span>
                                <div className="secrets-detail-field-value">{currentSource.config?.username || '-'}</div>
                            </div>
                        </>
                    )}
                    {currentSource.type === 'vault' && (
                        <>
                            <div className="secrets-detail-field">
                                <span className="secrets-detail-field-label">Vault 地址</span>
                                <div className="secrets-detail-field-value"><Text code copyable>{currentSource.config?.address || '-'}</Text></div>
                            </div>
                            <div className="secrets-detail-field">
                                <span className="secrets-detail-field-label">Secret 路径</span>
                                <div className="secrets-detail-field-value"><Text code>{currentSource.config?.secret_path || currentSource.config?.path_template || '-'}</Text></div>
                            </div>
                            <div className="secrets-detail-field">
                                <span className="secrets-detail-field-label">认证</span>
                                <div className="secrets-detail-field-value">{vaultAuthType}</div>
                            </div>
                            {vaultAuthType === 'token' && (
                                <div className="secrets-detail-field">
                                    <span className="secrets-detail-field-label">Token</span>
                                    <div className="secrets-detail-field-value"><Text type="secondary">••••••••</Text></div>
                                </div>
                            )}
                            {vaultAuthType === 'approle' && (
                                <div className="secrets-detail-field">
                                    <span className="secrets-detail-field-label">Secret ID</span>
                                    <div className="secrets-detail-field-value"><Text type="secondary">••••••••</Text></div>
                                </div>
                            )}
                        </>
                    )}
                    {currentSource.type === 'webhook' && (
                        <>
                            <div className="secrets-detail-field" style={{ gridColumn: '1 / -1' }}>
                                <span className="secrets-detail-field-label">URL</span>
                                <div className="secrets-detail-field-value"><Text code copyable style={{ wordBreak: 'break-all' }}>{currentSource.config?.url || '-'}</Text></div>
                            </div>
                            <div className="secrets-detail-field">
                                <span className="secrets-detail-field-label">请求方法</span>
                                <div className="secrets-detail-field-value"><Tag>{currentSource.config?.method || 'POST'}</Tag></div>
                            </div>
                            <div className="secrets-detail-field">
                                <span className="secrets-detail-field-label">认证方式</span>
                                <div className="secrets-detail-field-value">{currentSource.config?.auth?.type || '无认证'}</div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
