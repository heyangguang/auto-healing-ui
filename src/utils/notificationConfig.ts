type NotificationTriggerConfigLike = {
  enabled?: boolean;
  configs?: Array<{ channel_id: string; template_id: string }>;
  channel_ids?: string[];
  template_id?: string;
};

type NotificationConfigLike = {
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
  if ((config.channel_ids?.length || 0) > 0 && config.template_id) {
    return config.channel_ids!.map((channelID) => ({
      channel_id: channelID,
      template_id: config.template_id!,
    }));
  }
  return [];
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
