import React from 'react';
import {
  AuditOutlined,
  ClockCircleOutlined,
  FlagOutlined,
  SendOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { getDictItems, onDictRefresh } from '@/utils/dictCache';

export interface NotificationEventTypeConfig {
  bg: string;
  color: string;
  icon: React.ReactNode;
  label: string;
  labelCN: string;
}

const FB_CONFIG: Record<string, NotificationEventTypeConfig> = {
  execution_started: { icon: <ClockCircleOutlined />, color: '#13c2c2', label: 'STARTED', labelCN: '执行开始', bg: '#e6fffb' },
  execution_result: { icon: <ThunderboltOutlined />, color: '#1890ff', label: 'EXECUTION', labelCN: '执行结果', bg: '#e6f4ff' },
  flow_result: { icon: <SendOutlined />, color: '#722ed1', label: 'FLOW', labelCN: '流程结果', bg: '#f9f0ff' },
  approval_required: { icon: <AuditOutlined />, color: '#fa8c16', label: 'APPROVAL', labelCN: '等待审批', bg: '#fff7e6' },
  manual_notification: { icon: <FlagOutlined />, color: '#8c8c8c', label: 'MANUAL', labelCN: '手动通知', bg: '#f5f5f5' },
};

const EVENT_TYPE_ORDER = ['execution_started', 'execution_result', 'flow_result', 'approval_required', 'manual_notification'] as const;
const UNKNOWN_CONFIG: NotificationEventTypeConfig = {
  icon: <FlagOutlined />,
  color: '#8c8c8c',
  label: 'UNKNOWN',
  labelCN: '未知',
  bg: '#f5f5f5',
};

export let NOTIFICATION_EVENT_TYPE_CONFIG: Record<string, NotificationEventTypeConfig> = { ...FB_CONFIG };

export function getNotificationEventTypeConfig(type: string): NotificationEventTypeConfig {
  return NOTIFICATION_EVENT_TYPE_CONFIG[type?.toLowerCase()] || UNKNOWN_CONFIG;
}

export function isKnownNotificationEventType(type: string): type is AutoHealing.EventType {
  return EVENT_TYPE_ORDER.includes(type as typeof EVENT_TYPE_ORDER[number]);
}

export function getNotificationEventTypeOptions() {
  const dictKeys = getDictItems('notification_event_type')?.map((item) => item.dict_key) || [];
  const orderedKeys = EVENT_TYPE_ORDER.filter((key) => dictKeys.length === 0 || dictKeys.includes(key));
  return orderedKeys.map((key) => ({
    label: getNotificationEventTypeConfig(key).labelCN,
    value: key,
  }));
}

function refreshNotificationEventTypes() {
  const items = getDictItems('notification_event_type');
  if (!items?.length) {
    return;
  }
  const map: Record<string, NotificationEventTypeConfig> = {};
  items.forEach((item) => {
    const fallback = FB_CONFIG[item.dict_key];
    map[item.dict_key] = {
      icon: fallback?.icon || UNKNOWN_CONFIG.icon,
      color: item.color || fallback?.color || UNKNOWN_CONFIG.color,
      label: (item.label_en || item.label || item.dict_key).toUpperCase(),
      labelCN: item.label || fallback?.labelCN || item.dict_key,
      bg: item.bg || fallback?.bg || UNKNOWN_CONFIG.bg,
    };
  });
  NOTIFICATION_EVENT_TYPE_CONFIG = map;
}

onDictRefresh(refreshNotificationEventTypes);
refreshNotificationEventTypes();
