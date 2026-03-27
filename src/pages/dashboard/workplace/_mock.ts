import { getActivities, getChartData, getNotice } from './workplaceMockHandlers';

export default {
  'GET  /api/project/notice': getNotice,
  'GET  /api/activities': getActivities,
  'GET  /api/fake_workplace_chart_data': getChartData,
};
