import { TALL_PIE_CHART_WIDGET_LAYOUT, WIDE_CHART_WIDGET_LAYOUT } from './widgetLayoutPresets';
import { HEALING_EXECUTION_WIDGET_REGISTRY } from './widgetRegistryHealingExecution';
import { INCIDENTS_CMDB_WIDGET_REGISTRY } from './widgetRegistryIncidentsCmdb';
import { OPERATIONS_WIDGET_REGISTRY } from './widgetRegistryOperations';

describe('widget layout presets', () => {
  it('uses the tall pie preset for representative donut and pie widgets', () => {
    expect(INCIDENTS_CMDB_WIDGET_REGISTRY['chart-incident-status'].defaultLayout).toEqual(TALL_PIE_CHART_WIDGET_LAYOUT);
    expect(INCIDENTS_CMDB_WIDGET_REGISTRY['chart-incident-source'].defaultLayout).toEqual(TALL_PIE_CHART_WIDGET_LAYOUT);
    expect(HEALING_EXECUTION_WIDGET_REGISTRY['chart-instance-status'].defaultLayout).toEqual(TALL_PIE_CHART_WIDGET_LAYOUT);
    expect(OPERATIONS_WIDGET_REGISTRY['chart-plugin-status'].defaultLayout).toEqual(TALL_PIE_CHART_WIDGET_LAYOUT);
  });

  it('keeps non-pie charts on the wide chart preset', () => {
    expect(HEALING_EXECUTION_WIDGET_REGISTRY['chart-exec-status'].defaultLayout).toEqual(WIDE_CHART_WIDGET_LAYOUT);
    expect(INCIDENTS_CMDB_WIDGET_REGISTRY['chart-incident-category'].defaultLayout).toEqual(WIDE_CHART_WIDGET_LAYOUT);
  });

  it('keeps non-chart widgets on their existing default sizes', () => {
    expect(INCIDENTS_CMDB_WIDGET_REGISTRY['list-incident-recent'].defaultLayout).toEqual({ w: 6, h: 5, minW: 4, minH: 4 });
    expect(HEALING_EXECUTION_WIDGET_REGISTRY['stat-exec-total'].defaultLayout).toEqual({ w: 3, h: 2, minW: 2, minH: 2 });
  });
});
