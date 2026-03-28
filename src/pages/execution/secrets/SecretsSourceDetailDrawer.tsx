import React from 'react';
import {
    ApiOutlined,
    EditOutlined,
} from '@ant-design/icons';
import { Alert, Badge, Button, Drawer, Space, Spin } from 'antd';
import { getSecretsSourceStatusMeta } from '@/constants/secretsDicts';
import { getAuthTypeConfig, getSourceTypeConfig } from './secretSourcePageConfig';
import SecretsSourceBasicInfoCard from './SecretsSourceBasicInfoCard';
import SecretsSourceConnectionConfigCard from './SecretsSourceConnectionConfigCard';
import SecretsSourceRawConfigCard from './SecretsSourceRawConfigCard';
import './index.css';

type SecretsSourceDetailDrawerProps = {
    canTestSource: boolean;
    canUpdateSource: boolean;
    currentSource: AutoHealing.SecretsSource | null;
    detailError?: string;
    loading: boolean;
    onClose: () => void;
    onEdit: (source: AutoHealing.SecretsSource) => void;
    onOpenTestQuery: (source: AutoHealing.SecretsSource) => void;
    open: boolean;
};

export default function SecretsSourceDetailDrawer(props: SecretsSourceDetailDrawerProps) {
    const { canTestSource, canUpdateSource, currentSource, detailError, loading, onClose, onEdit, onOpenTestQuery, open } = props;
    if (!currentSource) {
        return null;
    }

    const typeConfig = getSourceTypeConfig(currentSource.type);
    const authConfig = getAuthTypeConfig(currentSource.auth_type);
    const statusConfig = getSecretsSourceStatusMeta(currentSource.status);

    return (
        <Drawer
            title={null}
            size={560}
            open={open}
            onClose={onClose}
            styles={{ header: { display: 'none' }, body: { padding: 0 } }}
            destroyOnHidden
        >
            <Spin spinning={loading}>
                <div className="secrets-detail-header">
                    <div className="secrets-detail-header-top">
                        <div className="secrets-detail-header-icon" style={{ background: typeConfig.bgColor, color: typeConfig.color }}>
                            {typeConfig.icon}
                        </div>
                        <div className="secrets-detail-header-info">
                            <div className="secrets-detail-title">{currentSource.name}</div>
                            <div className="secrets-detail-sub">{typeConfig.label}</div>
                        </div>
                        <Badge status={statusConfig.badge} text={statusConfig.label} />
                    </div>
                    <Space size="small">
                        <Button size="small" icon={<ApiOutlined />} onClick={() => onOpenTestQuery(currentSource)} disabled={currentSource.status !== 'active' || !canTestSource}>
                            测试凭据
                        </Button>
                        <Button size="small" icon={<EditOutlined />} onClick={() => onEdit(currentSource)} disabled={!canUpdateSource}>
                            编辑配置
                        </Button>
                    </Space>
                </div>

                <div className="secrets-detail-body">
                    {detailError && (
                        <Alert
                            type="warning"
                            showIcon
                            message="详情加载失败"
                            description={`${detailError}，当前仅展示列表摘要信息。`}
                            style={{ marginBottom: 16 }}
                        />
                    )}
                    <SecretsSourceBasicInfoCard authConfig={authConfig} currentSource={currentSource} />
                    <SecretsSourceConnectionConfigCard currentSource={currentSource} />
                    <SecretsSourceRawConfigCard currentSource={currentSource} />
                </div>
            </Spin>
        </Drawer>
    );
}
