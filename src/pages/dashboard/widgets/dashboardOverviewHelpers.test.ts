jest.mock('@/constants/incidentDicts', () => ({
  INCIDENT_CHART_LABELS: {
    dismissed: '已忽略',
    failed: '失败',
    healed: '已自愈',
    pending: '待处理',
  },
}));

jest.mock('@/constants/instanceDicts', () => ({
  INSTANCE_STATUS_LABELS: {
    completed: '已完成',
    running: '执行中',
  },
}));

jest.mock('@/constants/executionDicts', () => ({
  RUN_STATUS_LABELS: {
    failed: '失败',
    success: '成功',
  },
}));

import {
  buildExecutionStatusChartData,
  buildIncidentStatusChartData,
  buildInstanceStatusChartData,
  getIncidentScannedCount,
  getStatusCount,
} from './dashboardOverviewHelpers';

describe('dashboard overview helpers', () => {
  it('derives incident counts from overview data', () => {
    const overview = {
      total: 10,
      unscanned: 3,
      by_status: [
        { status: 'open', count: 4 },
        { status: 'resolved', count: 5 },
        { status: 'dismissed', count: 1 },
      ],
      by_healing_status: [
        { status: 'pending', count: 4 },
        { status: 'healed', count: 5 },
        { status: 'failed', count: 1 },
      ],
    };

    expect(getIncidentScannedCount(overview)).toBe(7);
    expect(getStatusCount(overview.by_healing_status, 'healed')).toBe(5);
    expect(buildIncidentStatusChartData(overview)).toEqual([
      { type: 'open', value: 4 },
      { type: 'resolved', value: 5 },
      { type: '已忽略', value: 1 },
    ]);
  });

  it('maps healing instance status distribution from dashboard overview', () => {
    expect(buildInstanceStatusChartData({
      instances_by_status: [
        { status: 'running', count: 2 },
        { status: 'completed', count: 6 },
        { status: 'failed', count: 0 },
      ],
    })).toEqual([
      { type: '执行中', value: 2 },
      { type: '已完成', value: 6 },
    ]);
  });

  it('maps execution run status distribution from dashboard overview', () => {
    expect(buildExecutionStatusChartData({
      runs_by_status: [
        { status: 'success', count: 8 },
        { status: 'failed', count: 2 },
        { status: 'cancelled', count: 0 },
      ],
    })).toEqual([
      { label: '成功', count: 8, status: 'success' },
      { label: '失败', count: 2, status: 'failed' },
    ]);
  });
});
