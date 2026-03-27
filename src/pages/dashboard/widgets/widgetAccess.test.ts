jest.mock('@/utils/pathAccess', () => ({
  canAccessPath: jest.fn(),
}));

import { canAccessPath } from '@/utils/pathAccess';
import { canAccessDashboardWidget } from './widgetAccess';
import type { WidgetDefinition } from './widgetRegistry';

describe('dashboard widget access', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('requires both approval and trigger permissions for the aggregated pending widget', () => {
    const definition = {
      id: 'stat-pending-items',
      name: '待办事项',
      description: '',
      category: 'stat',
      icon: null,
      defaultLayout: { w: 1, h: 1, minW: 1, minH: 1 },
    } as WidgetDefinition;

    expect(canAccessDashboardWidget(definition, { canViewApprovals: true, canViewPendingTrigger: true })).toBe(true);
    expect(canAccessDashboardWidget(definition, { canViewApprovals: true, canViewPendingTrigger: false })).toBe(false);
  });

  it('delegates section widgets to representative route access checks', () => {
    (canAccessPath as jest.Mock).mockReturnValue(true);

    const definition = {
      id: 'stat-plugin-count',
      name: '插件数量',
      description: '',
      category: 'stat',
      section: 'plugins',
      icon: null,
      defaultLayout: { w: 1, h: 1, minW: 1, minH: 1 },
    } as WidgetDefinition;

    expect(canAccessDashboardWidget(definition, {})).toBe(true);
    expect(canAccessPath).toHaveBeenCalledWith('/resources/plugins', {});
  });
});
