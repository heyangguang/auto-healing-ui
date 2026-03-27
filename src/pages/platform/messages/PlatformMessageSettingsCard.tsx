import React from 'react';
import { Alert, Button, Input, Space, Typography } from 'antd';
import dayjs from 'dayjs';

const { Text } = Typography;

export interface PlatformMessageSettingsCardProps {
  visible: boolean;
  canManage: boolean;
  loading: boolean;
  submitting: boolean;
  error: string | null;
  draftRetentionDays: string;
  updatedAt?: string;
  canSave: boolean;
  onRetentionDaysChange: (value: string) => void;
  onSave: () => Promise<void>;
}

function formatUpdatedAt(value?: string) {
  if (!value) {
    return '尚未配置';
  }
  return dayjs(value).format('YYYY-MM-DD HH:mm:ss');
}

export default function PlatformMessageSettingsCard({
  visible,
  canManage,
  loading,
  submitting,
  error,
  draftRetentionDays,
  updatedAt,
  canSave,
  onRetentionDaysChange,
  onSave,
}: PlatformMessageSettingsCardProps) {
  if (!visible) {
    return null;
  }

  return (
    <div style={{ padding: '24px 24px 0', maxWidth: 800 }}>
      <div style={{ padding: 16, border: '1px solid #f0f0f0', borderRadius: 8, background: '#fafafa', marginBottom: 24 }}>
        <div style={{ marginBottom: 12 }}>
          <Text strong>站内信保留策略</Text>
          <div style={{ marginTop: 4 }}>
            <Text type="secondary">后端当前使用 `retention_days` 控制站内信保留天数，平台设置修改后即时生效。</Text>
          </div>
        </div>
        {error ? <Alert type="error" showIcon message={error} style={{ marginBottom: 12 }} /> : null}
        <Space align="end" size={12} wrap>
          <div>
            <Text type="secondary" style={{ display: 'block', marginBottom: 6 }}>保留天数</Text>
            <Input
              type="number"
              min={1}
              max={3650}
              value={draftRetentionDays}
              disabled={loading || !canManage}
              onChange={(event) => onRetentionDaysChange(event.target.value)}
              style={{ width: 160 }}
              aria-label="站内信保留天数"
            />
          </div>
          <Button
            type="primary"
            loading={submitting}
            disabled={loading || !canManage || !canSave}
            onClick={() => void onSave()}
          >
            保存策略
          </Button>
        </Space>
        <div style={{ marginTop: 12 }}>
          <Text type="secondary">最近更新时间：{formatUpdatedAt(updatedAt)}</Text>
        </div>
      </div>
    </div>
  );
}
