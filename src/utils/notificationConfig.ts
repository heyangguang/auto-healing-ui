export type NotificationTriggerConfigLike = {
  enabled?: boolean;
  configs?: Array<{ channel_id: string; template_id: string }>;
  channel_ids?: string[];
  template_id?: string;
};

export type NotificationConfigLike = {
  enabled?: boolean;
  on_start?: NotificationTriggerConfigLike;
  on_success?: NotificationTriggerConfigLike;
  on_failure?: NotificationTriggerConfigLike;
  on_timeout?: NotificationTriggerConfigLike;
};

type NotificationTriggerKey = 'on_start' | 'on_success' | 'on_failure' | 'on_timeout';

const TRIGGER_KEYS: NotificationTriggerKey[] = [
  'on_start',
  'on_success',
  'on_failure',
  'on_timeout',
];

const getTriggerConfigList = (config?: NotificationTriggerConfigLike) => {
  if (!config) return [];
  if (config.configs?.length) return config.configs;
  const templateId = config.template_id;
  const channelIds = config.channel_ids;
  if (!channelIds?.length || !templateId) {
    return [];
  }
  return channelIds.map((channelID) => ({
    channel_id: channelID,
    template_id: templateId,
  }));
};

export const hasEffectiveNotificationConfig = (config?: NotificationConfigLike) => {
  if (!config || config.enabled === false) return false;
  return TRIGGER_KEYS.some((key) => {
    const trigger = config[key];
    if (!trigger || trigger.enabled === false) return false;
    return getTriggerConfigList(trigger).length > 0;
  });
};

export const getEnabledNotificationTriggers = (config?: NotificationConfigLike) => {
  if (!config || config.enabled === false) return [];
  return TRIGGER_KEYS.filter((key) => {
    const trigger = config[key];
    if (!trigger || trigger.enabled === false) return false;
    return getTriggerConfigList(trigger).length > 0;
  });
};
