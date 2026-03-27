import React from 'react';
import { InfoCircleOutlined, StarFilled } from '@ant-design/icons';
import { Tag } from 'antd';
import dayjs from 'dayjs';

type SecretsSourceBasicInfoCardProps = {
    authConfig: { icon: React.ReactNode; color: string; label: string };
    currentSource: AutoHealing.SecretsSource;
};

export default function SecretsSourceBasicInfoCard(props: SecretsSourceBasicInfoCardProps) {
    const { authConfig, currentSource } = props;
    return (
        <div className="secrets-detail-card">
            <div className="secrets-detail-card-header">
                <InfoCircleOutlined className="secrets-detail-card-header-icon" />
                <span className="secrets-detail-card-header-title">基本信息</span>
            </div>
            <div className="secrets-detail-card-body">
                <div className="secrets-detail-grid">
                    <div className="secrets-detail-field">
                        <span className="secrets-detail-field-label">认证方式</span>
                        <div className="secrets-detail-field-value"><Tag icon={authConfig.icon} color={authConfig.color}>{authConfig.label}</Tag></div>
                    </div>
                    <div className="secrets-detail-field">
                        <span className="secrets-detail-field-label">优先级</span>
                        <div className="secrets-detail-field-value">{currentSource.priority}</div>
                    </div>
                    <div className="secrets-detail-field">
                        <span className="secrets-detail-field-label">默认</span>
                        <div className="secrets-detail-field-value">{currentSource.is_default ? <><StarFilled style={{ color: '#faad14', marginRight: 4 }} />是</> : '否'}</div>
                    </div>
                    <div className="secrets-detail-field">
                        <span className="secrets-detail-field-label">查询键</span>
                        <div className="secrets-detail-field-value">
                            {currentSource.config?.query_key ? <Tag color="blue">按 {currentSource.config.query_key === 'ip' ? 'IP' : '主机名'}</Tag> : '-'}
                        </div>
                    </div>
                    <div className="secrets-detail-field">
                        <span className="secrets-detail-field-label">创建时间</span>
                        <div className="secrets-detail-field-value">{dayjs(currentSource.created_at).format('YYYY-MM-DD HH:mm')}</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
