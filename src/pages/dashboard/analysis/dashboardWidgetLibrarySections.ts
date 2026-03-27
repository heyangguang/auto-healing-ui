import type { WidgetDefinition } from '../widgets/widgetRegistry';
import { WIDGET_SECTIONS, getWidgetsBySection } from '../widgets/widgetRegistry';
import { canAccessDashboardWidget } from '../widgets/widgetAccess';

type AccessMap = Record<string, unknown>;

export function buildDashboardWidgetLibrarySections(search: string, access: AccessMap) {
  const normalizedSearch = search.trim().toLowerCase();

  return WIDGET_SECTIONS.map((section) => {
    const widgets = getWidgetsBySection(section.key).filter((widget) =>
      canAccessDashboardWidget(widget, access),
    );
    const filteredWidgets = normalizedSearch
      ? widgets.filter((widget) => matchesWidgetSearch(widget, normalizedSearch))
      : widgets;
    return { ...section, widgets: filteredWidgets };
  }).filter((section) => section.widgets.length > 0);
}

function matchesWidgetSearch(widget: WidgetDefinition, normalizedSearch: string) {
  return widget.name.toLowerCase().includes(normalizedSearch)
    || widget.description.toLowerCase().includes(normalizedSearch);
}
