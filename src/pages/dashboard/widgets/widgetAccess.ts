import { canAccessPath } from '@/utils/pathAccess';
import type { WidgetDefinition } from './widgetRegistry';

type AccessMap = Record<string, unknown>;

const SECTION_PATHS: Record<string, string> = {
  cmdb: '/resources/cmdb',
  execution: '/execution/schedules',
  git: '/execution/git-repos',
  incidents: '/resources/incidents',
  notifications: '/notification/records',
  playbooks: '/execution/playbooks',
  plugins: '/resources/plugins',
  secrets: '/resources/secrets',
  users: '/system/users',
};

const WIDGET_PATH_OVERRIDES: Record<string, string> = {
  'chart-approval-status': '/pending/approvals',
  'chart-flow-top10': '/healing/flows',
  'chart-instance-status': '/healing/instances',
  'chart-instance-trend-7d': '/healing/instances',
  'chart-rule-trigger-mode': '/healing/rules',
  'list-pending-approvals': '/pending/approvals',
  'list-pending-triggers': '/pending/triggers',
  'list-recent-instances': '/healing/instances',
  'stat-active-flows': '/healing/flows',
  'stat-active-rules': '/healing/rules',
  'stat-healing-flows': '/healing/flows',
  'stat-healing-rules-total': '/healing/rules',
  'stat-instance-total': '/healing/instances',
  'stat-instances-running': '/healing/instances',
  'stat-pending-approvals': '/pending/approvals',
  'stat-pending-triggers': '/pending/triggers',
};

export function canAccessDashboardWidget(definition: WidgetDefinition, access: AccessMap): boolean {
  if (definition.id === 'stat-pending-items') {
    return Boolean(access.canViewApprovals) && Boolean(access.canViewPendingTrigger);
  }

  const widgetPath = WIDGET_PATH_OVERRIDES[definition.id];
  if (widgetPath) {
    return canAccessPath(widgetPath, access);
  }

  const sectionPath = definition.section ? SECTION_PATHS[definition.section] : '';
  if (sectionPath) {
    return canAccessPath(sectionPath, access);
  }

  return true;
}
