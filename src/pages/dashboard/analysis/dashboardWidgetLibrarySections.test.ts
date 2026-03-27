jest.mock('../widgets/widgetAccess', () => ({
  canAccessDashboardWidget: jest.fn(),
}));

jest.mock('../widgets/widgetRegistry', () => ({
  WIDGET_SECTIONS: [
    { key: 'plugins', label: '插件', count: 2 },
    { key: 'users', label: '用户', count: 1 },
  ],
  getWidgetsBySection: jest.fn((section: string) => {
    if (section === 'plugins') {
      return [
        { id: 'plugin-1', name: '插件趋势', description: '插件趋势说明', section: 'plugins' },
        { id: 'plugin-2', name: '插件错误', description: '异常统计', section: 'plugins' },
      ];
    }
    return [{ id: 'user-1', name: '最近登录', description: '登录用户', section: 'users' }];
  }),
}));

import { canAccessDashboardWidget } from '../widgets/widgetAccess';
import { buildDashboardWidgetLibrarySections } from './dashboardWidgetLibrarySections';

describe('dashboard widget library sections', () => {
  it('recomputes widget visibility from the latest access map', () => {
    (canAccessDashboardWidget as jest.Mock).mockImplementation((widget, access) =>
      Array.isArray(access.allowedWidgets) && access.allowedWidgets.includes(widget.id),
    );

    const noAccessSections = buildDashboardWidgetLibrarySections('', { allowedWidgets: [] });
    const pluginAccessSections = buildDashboardWidgetLibrarySections('', { allowedWidgets: ['plugin-1'] });

    expect(noAccessSections).toEqual([]);
    expect(pluginAccessSections).toHaveLength(1);
    expect(pluginAccessSections[0].widgets).toHaveLength(1);
    expect(pluginAccessSections[0].widgets[0].id).toBe('plugin-1');
  });

  it('filters accessible widgets by search text', () => {
    (canAccessDashboardWidget as jest.Mock).mockReturnValue(true);

    const sections = buildDashboardWidgetLibrarySections('错误', {});

    expect(sections).toHaveLength(1);
    expect(sections[0].widgets).toEqual([
      { id: 'plugin-2', name: '插件错误', description: '异常统计', section: 'plugins' },
    ]);
  });
});
