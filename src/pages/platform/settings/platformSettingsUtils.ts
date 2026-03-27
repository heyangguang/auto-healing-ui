import type { PlatformSettingItem, PlatformSettingModule } from '@/services/auto-healing/platform/settings';

export type PlatformSettingEditableValue = string | number | boolean;
export type PlatformSettingEditValues = Record<string, PlatformSettingEditableValue>;
export type PlatformSettingChange = {
  key: string;
  value: string;
};

export const MODULE_LABELS: Record<string, string> = {
  site: '站点配置',
  site_message: '站内信设置',
  security: '安全设置',
  system: '系统设置',
  email: '邮件服务',
};

export const isSensitiveSettingKey = (key?: string) => {
  const lower = (key || '').toLowerCase();
  return lower.includes('password')
    || lower.includes('secret')
    || lower.includes('token')
    || lower.includes('api_key');
};

export const createModuleEditValues = (
  module: PlatformSettingModule,
): PlatformSettingEditValues => {
  const values: PlatformSettingEditValues = {};
  module.settings.forEach((setting) => {
    if (isSensitiveSettingKey(setting.key)) {
      values[setting.key] = '';
      return;
    }
    if (setting.type === 'bool') {
      values[setting.key] = setting.value === 'true';
      return;
    }
    if (setting.type === 'int') {
      values[setting.key] = Number(setting.value) || 0;
      return;
    }
    values[setting.key] = setting.value || '';
  });
  return values;
};

const toSettingValue = (
  setting: PlatformSettingItem,
  value: PlatformSettingEditableValue | undefined,
) => {
  if (setting.type === 'bool') return String(Boolean(value));
  return String(value ?? '');
};

export const buildModuleSettingChanges = (
  module: PlatformSettingModule,
  editValues: PlatformSettingEditValues,
): PlatformSettingChange[] =>
  module.settings.reduce<PlatformSettingChange[]>((changes, setting) => {
    const nextValue = toSettingValue(setting, editValues[setting.key]);
    if (isSensitiveSettingKey(setting.key) && nextValue === '') {
      return changes;
    }
    if (nextValue !== setting.value) {
      changes.push({ key: setting.key, value: nextValue });
    }
    return changes;
  }, []);
