import { buildScheduleRequestData } from './scheduleFormHelpers';

describe('scheduleFormHelpers', () => {
  it('uses form max_failures instead of stale editingSchedule value', () => {
    const payload = buildScheduleRequestData({
      editingSchedule: { max_failures: 9 } as AutoHealing.ExecutionSchedule,
      formValues: {
        max_failures: 3,
        name: 'Nightly',
        schedule_type: 'cron',
        task_id: 'task-1',
      },
      isEdit: true,
      normalizedOverrideValues: {},
      secretsSourceIds: [],
      skipNotification: false,
      targetHostsOverride: [],
    });

    expect(payload.max_failures).toBe(3);
  });
});
