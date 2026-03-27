import { HEALING_EXECUTION_WIDGET_REGISTRY } from './widgetRegistryHealingExecution';
import { INCIDENTS_CMDB_WIDGET_REGISTRY } from './widgetRegistryIncidentsCmdb';
import { OPERATIONS_WIDGET_REGISTRY } from './widgetRegistryOperations';
import type { WidgetDefinition } from './widgetRegistryTypes';

export type { WidgetComponentProps, WidgetDefinition } from './widgetRegistryTypes';

export const WIDGET_REGISTRY: Record<string, WidgetDefinition> = {
  ...INCIDENTS_CMDB_WIDGET_REGISTRY,
  ...HEALING_EXECUTION_WIDGET_REGISTRY,
  ...OPERATIONS_WIDGET_REGISTRY,
};

export const WIDGET_CATEGORIES = [
  { key: 'stat', label: '📊 核心指标', description: '关键 KPI 数值卡片' },
  { key: 'chart', label: '📈 图表', description: '可视化数据图表' },
  { key: 'list', label: '📋 列表', description: '实时数据列表' },
  { key: 'status', label: '🔌 系统状态', description: '系统组件状态面板' },
] as const;

export const WIDGET_SECTIONS = [
  { key: 'incidents', label: '🚨 工单/事件', count: 14 },
  { key: 'cmdb', label: '🖥️ 资产管理', count: 12 },
  { key: 'healing', label: '🩺 自愈引擎', count: 17 },
  { key: 'execution', label: '⚡ 执行管理', count: 14 },
  { key: 'plugins', label: '🔌 插件管理', count: 10 },
  { key: 'notifications', label: '🔔 通知管理', count: 7 },
  { key: 'git', label: '📦 Git 仓库', count: 4 },
  { key: 'playbooks', label: '📝 Playbook', count: 3 },
  { key: 'secrets', label: '🔑 密钥管理', count: 3 },
  { key: 'users', label: '👥 用户权限', count: 2 },
] as const;

export function getWidgetsByCategory(category: string): WidgetDefinition[] {
  return Object.values(WIDGET_REGISTRY).filter((widget) => widget.category === category);
}

export function getWidgetsBySection(section: string): WidgetDefinition[] {
  return Object.values(WIDGET_REGISTRY).filter((widget) => widget.section === section);
}

export function getRequiredSections(widgetIds: string[]): string[] {
  const sections = new Set<string>();
  widgetIds.forEach((id) => {
    const widget = WIDGET_REGISTRY[id];
    if (widget?.section) {
      sections.add(widget.section);
    }
  });
  return Array.from(sections);
}
