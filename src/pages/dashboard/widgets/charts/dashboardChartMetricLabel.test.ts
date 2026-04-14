import { getDashboardChartMetricLabel } from './dashboardChartMetricLabel';

describe('dashboardChartMetricLabel', () => {
  it('returns field-specific labels when the chart context needs them', () => {
    expect(getDashboardChartMetricLabel('healing', 'rules_by_trigger_mode')).toBe('规则数');
    expect(getDashboardChartMetricLabel('execution', 'schedules_by_type')).toBe('定时任务数');
    expect(getDashboardChartMetricLabel('notifications', 'by_channel_type')).toBe('渠道数');
  });

  it('falls back to section labels for general charts', () => {
    expect(getDashboardChartMetricLabel('incidents', 'trend_7d')).toBe('工单数');
    expect(getDashboardChartMetricLabel('plugins', 'by_type')).toBe('插件数');
  });
});
