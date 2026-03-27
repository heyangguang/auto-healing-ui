import React from 'react';
import { Divider, Tag, Typography } from 'antd';
import { KeyOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import SecretsSelector from '@/components/SecretsSelector';

const { Text } = Typography;

interface ExecutionMissionControlSecretsCardProps {
    additionalSecretIds: string[];
    secretsSources: AutoHealing.SecretsSource[];
    templateSecretIds: string[];
    onAdditionalSecretIdsChange: (secretIds: string[]) => void;
}

const secretMetaTagStyle = {
    margin: 0,
    padding: '0 4px',
    fontSize: 10,
    lineHeight: '16px',
    borderRadius: 0,
} as const;

const SecretPresetChip: React.FC<{
    secretId: string;
    secretsSources: AutoHealing.SecretsSource[];
}> = ({ secretId, secretsSources }) => {
    const secret = secretsSources.find((source) => source.id === secretId);

    return (
        <div
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '4px 8px',
                border: '1px solid #f0f0f0',
                borderRadius: 0,
                background: '#f5f5f5',
                fontSize: 12,
                color: '#595959',
                userSelect: 'none',
            }}
        >
            <KeyOutlined style={{ marginRight: 6, color: '#8c8c8c' }} />
            <span style={{ fontWeight: 500, marginRight: 4 }}>{secret ? secret.name : secretId.slice(0, 6)}</span>
            {secret && (
                <span style={{ color: '#999', fontSize: 10, display: 'flex', alignItems: 'center', gap: 4 }}>
                    {secret.priority !== undefined && (
                        <Tag style={secretMetaTagStyle} color="default">
                            P{secret.priority}
                        </Tag>
                    )}
                    {secret.auth_type === 'password' ? '密码' : '密钥'}
                </span>
            )}
        </div>
    );
};

const TemplateSecretsPreset: React.FC<{
    secretsSources: AutoHealing.SecretsSource[];
    templateSecretIds: string[];
}> = ({ secretsSources, templateSecretIds }) => {
    if (templateSecretIds.length === 0) {
        return <Text type="secondary">-</Text>;
    }

    return (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {templateSecretIds.map((secretId) => (
                <SecretPresetChip
                    key={secretId}
                    secretId={secretId}
                    secretsSources={secretsSources}
                />
            ))}
        </div>
    );
};

const ExecutionMissionControlSecretsCard: React.FC<ExecutionMissionControlSecretsCardProps> = ({
    additionalSecretIds,
    secretsSources,
    templateSecretIds,
    onAdditionalSecretIdsChange,
}) => (
    <div className="industrial-dashed-box" style={{ height: '100%' }}>
        <div className="industrial-dashed-box-title">
            <span><SafetyCertificateOutlined /> 安全凭证 (Secrets)</span>
            <Tag color="cyan">Merge Mode</Tag>
        </div>

        <div style={{ marginBottom: 8 }}>
            <Text type="secondary" style={{ fontSize: 12, marginBottom: 4, display: 'block' }}>模板预设:</Text>
            <TemplateSecretsPreset
                secretsSources={secretsSources}
                templateSecretIds={templateSecretIds}
            />
        </div>

        <Divider style={{ margin: '8px 0' }} dashed />

        <Text type="secondary" style={{ fontSize: 12, marginBottom: 4, display: 'block' }}>临时追加:</Text>
        <SecretsSelector
            value={additionalSecretIds}
            onChange={onAdditionalSecretIdsChange}
            dataSource={secretsSources}
        />
    </div>
);

export default ExecutionMissionControlSecretsCard;
