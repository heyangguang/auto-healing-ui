import React from 'react';
import { SettingOutlined } from '@ant-design/icons';

const SENSITIVE_KEYS = ['api_key', 'key', 'passphrase', 'password', 'private_key', 'secret', 'secret_id', 'token'];

function maskSensitiveConfig(value: unknown): unknown {
    if (Array.isArray(value)) {
        return value.map(maskSensitiveConfig);
    }
    if (!value || typeof value !== 'object') {
        return value;
    }

    return Object.fromEntries(
        Object.entries(value as Record<string, unknown>).map(([key, item]) => {
            const normalizedKey = key.toLowerCase();
            if (SENSITIVE_KEYS.some((sensitiveKey) => normalizedKey.includes(sensitiveKey))) {
                return [key, item ? '******' : item];
            }
            return [key, maskSensitiveConfig(item)];
        }),
    );
}

export default function SecretsSourceRawConfigCard({ currentSource }: { currentSource: AutoHealing.SecretsSource }) {
    return (
        <div className="secrets-detail-card">
            <div className="secrets-detail-card-header">
                <SettingOutlined className="secrets-detail-card-header-icon" />
                <span className="secrets-detail-card-header-title">原始配置 (JSON)</span>
            </div>
            <div className="secrets-detail-card-body" style={{ padding: 0 }}>
                <pre className="secrets-raw-config">{JSON.stringify(maskSensitiveConfig(currentSource.config), null, 2)}</pre>
            </div>
        </div>
    );
}
