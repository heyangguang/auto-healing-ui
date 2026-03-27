import React from 'react';
import { Button, Card, Divider, Input, InputNumber, Space, Switch, Tag, Typography } from 'antd';
import { CloseOutlined, EditOutlined, SaveOutlined, SettingOutlined } from '@ant-design/icons';
import type { PlatformSettingItem, PlatformSettingModule } from '@/services/auto-healing/platform/settings';
import {
  MODULE_LABELS,
  type PlatformSettingEditableValue,
  type PlatformSettingEditValues,
  isSensitiveSettingKey,
} from './platformSettingsUtils';

const { Text } = Typography;
const { TextArea } = Input;

type PlatformSettingsModuleCardProps = {
  module: PlatformSettingModule;
  isEditing: boolean;
  isSaving: boolean;
  canManage: boolean;
  hasActiveEditor: boolean;
  editValues: PlatformSettingEditValues;
  isLast: boolean;
  onEnterEdit: (module: PlatformSettingModule) => void;
  onCancel: () => void;
  onSave: (module: PlatformSettingModule) => void;
  onValueChange: (key: string, value: PlatformSettingEditableValue) => void;
};

const renderReadOnlyValue = (setting: PlatformSettingItem) => {
  if (setting.type === 'bool') {
    const enabled = setting.value === 'true';
    return (
      <Tag color={enabled ? 'green' : 'default'} style={{ margin: 0 }}>
        {enabled ? '已启用' : '已禁用'}
      </Tag>
    );
  }

  if (setting.type === 'int') {
    return (
      <Space>
        <span style={{ fontSize: 13, color: '#262626', fontVariantNumeric: 'tabular-nums' }}>
          {setting.value || setting.default_value || '0'}
        </span>
        {setting.default_value && (
          <Text type="secondary" style={{ fontSize: 12 }}>
            默认值：{setting.default_value}
          </Text>
        )}
      </Space>
    );
  }

  if (!setting.value) {
    return (
      <Text type="secondary" style={{ fontSize: 12, fontStyle: 'italic' }}>
        未设置
      </Text>
    );
  }

  if (setting.type === 'json') {
    return (
      <pre
        style={{
          margin: 0,
          maxWidth: 360,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          fontSize: 12,
          lineHeight: 1.5,
          color: '#262626',
          fontFamily: "'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace",
        }}
      >
        {setting.value}
      </pre>
    );
  }

  if (isSensitiveSettingKey(setting.key)) {
    return <span style={{ fontSize: 13, color: '#262626' }}>{'••••••••'}</span>;
  }

  return <span style={{ fontSize: 13, color: '#262626' }}>{setting.value}</span>;
};

const renderEditInput = (
  setting: PlatformSettingItem,
  editValues: PlatformSettingEditValues,
  onValueChange: PlatformSettingsModuleCardProps['onValueChange'],
) => {
  const value = editValues[setting.key];

  if (setting.type === 'bool') {
    const checked = Boolean(value);
    return (
      <Space>
        <Switch checked={checked} onChange={(nextValue) => onValueChange(setting.key, nextValue)} />
        <Text type="secondary" style={{ fontSize: 12 }}>
          {checked ? '已启用' : '已禁用'}
        </Text>
      </Space>
    );
  }

  if (setting.type === 'int') {
    const numericValue = typeof value === 'number' ? value : Number(value) || 0;
    return (
      <Space>
        <InputNumber
          value={numericValue}
          min={0}
          style={{ width: 120 }}
          onChange={(nextValue) => onValueChange(setting.key, nextValue ?? 0)}
        />
        {setting.default_value && (
          <Text type="secondary" style={{ fontSize: 12 }}>
            默认值：{setting.default_value}
          </Text>
        )}
      </Space>
    );
  }

  if (setting.type === 'json') {
    return (
      <TextArea
        value={typeof value === 'string' ? value : String(value ?? '')}
        placeholder={setting.description || '请输入 JSON'}
        style={{ width: 360 }}
        autoSize={{ minRows: 4, maxRows: 10 }}
        onChange={(event) => onValueChange(setting.key, event.target.value)}
      />
    );
  }

  if (isSensitiveSettingKey(setting.key)) {
    return (
      <Input.Password
        value={typeof value === 'string' ? value : String(value ?? '')}
        placeholder="留空保持原值"
        style={{ width: 320 }}
        onChange={(event) => onValueChange(setting.key, event.target.value)}
      />
    );
  }

  return (
    <Input
      value={typeof value === 'string' ? value : String(value ?? '')}
      placeholder={setting.description || '请输入'}
      style={{ width: 320 }}
      onChange={(event) => onValueChange(setting.key, event.target.value)}
    />
  );
};

const PlatformSettingsModuleCard: React.FC<PlatformSettingsModuleCardProps> = ({
  module,
  isEditing,
  isSaving,
  canManage,
  hasActiveEditor,
  editValues,
  isLast,
  onEnterEdit,
  onCancel,
  onSave,
  onValueChange,
}) => (
  <Card
    title={(
      <Space>
        <SettingOutlined />
        {MODULE_LABELS[module.module] || module.module}
        <Tag color="blue" style={{ fontSize: 11 }}>
          {module.module}
        </Tag>
      </Space>
    )}
    extra={isEditing ? (
      <Space size={8}>
        <Button size="small" icon={<CloseOutlined />} onClick={onCancel} disabled={isSaving}>
          取消
        </Button>
        <Button
          type="primary"
          size="small"
          icon={<SaveOutlined />}
          loading={isSaving}
          onClick={() => onSave(module)}
        >
          保存
        </Button>
      </Space>
    ) : (
      <Button
        type="link"
        size="small"
        icon={<EditOutlined />}
        disabled={!canManage || hasActiveEditor}
        onClick={() => onEnterEdit(module)}
        style={{ padding: 0 }}
      >
        编辑
      </Button>
    )}
    style={{ marginBottom: isLast ? 0 : 16 }}
  >
    {module.settings.map((setting, index) => (
      <div key={setting.key}>
        {index > 0 && <Divider style={{ margin: '16px 0' }} />}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 500, marginBottom: 4 }}>{setting.label}</div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {setting.description}
            </Text>
            <div style={{ marginTop: 4 }}>
              <Text style={{ fontSize: 11, color: '#8c8c8c' }}>{setting.key}</Text>
            </div>
          </div>
          <div style={{ flexShrink: 0, paddingTop: 2 }}>
            {isEditing
              ? renderEditInput(setting, editValues, onValueChange)
              : renderReadOnlyValue(setting)}
          </div>
        </div>
      </div>
    ))}
  </Card>
);

export default PlatformSettingsModuleCard;
