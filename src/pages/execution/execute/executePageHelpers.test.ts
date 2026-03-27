import {
  buildExecuteTaskPayload,
  buildLaunchpadAdvancedParams,
  EXECUTION_RUN_ID_MISSING_ERROR,
  getExecutionRunIdOrThrow,
  getExecutionTemplateStatusFilter,
  getMissingRequiredVariableNames,
} from './executePageHelpers';

describe('executePageHelpers', () => {
  it('maps launchpad template status filters consistently', () => {
    expect(getExecutionTemplateStatusFilter('ready', false)).toBe('ready');
    expect(getExecutionTemplateStatusFilter('review', false)).toBe('pending_review');
    expect(getExecutionTemplateStatusFilter('', true)).toBe('ready');
    expect(getExecutionTemplateStatusFilter('', false)).toBe('');
  });

  it('extracts quick filters into launchpad search params without dropping advanced keys', () => {
    expect(
      buildLaunchpadAdvancedParams({
        filters: [
          { field: 'name', value: 'deploy' },
          { field: 'playbook_name', value: 'baseline' },
          { field: 'target_hosts', value: '10.0.0.8' },
          { field: '__enum__executor_type', value: 'docker' },
          { field: '__enum__status', value: 'ready' },
          { field: '__enum__last_run_status', value: 'failed' },
        ],
      }),
    ).toEqual({
      extra: {
        playbook_name: 'baseline',
        target_hosts: '10.0.0.8',
        last_run_status: 'failed',
      },
      newExecutor: 'docker',
      newSearch: 'deploy',
      newStatus: 'ready',
    });
  });

  it('builds manual execute payloads with merged hosts and deduplicated secrets', () => {
    expect(
      buildExecuteTaskPayload({
        additionalHosts: ['10.0.0.3'],
        additionalSecretIds: ['secret-2', 'secret-1'],
        extraVars: { env: 'prod' },
        selectedTemplate: {
          secrets_source_ids: ['secret-1'],
          target_hosts: '10.0.0.1,10.0.0.2',
        } as AutoHealing.ExecutionTask,
        skipNotification: true,
      }),
    ).toEqual({
      triggered_by: 'manual',
      secrets_source_ids: ['secret-1', 'secret-2'],
      extra_vars: { env: 'prod' },
      target_hosts: '10.0.0.1,10.0.0.2,10.0.0.3',
      skip_notification: true,
    });
  });

  it('extracts missing required variable names and validates execute response ids', () => {
    const playbook = {
      variables: [
        { name: 'env', required: true },
        { name: 'region', required: true },
        { name: 'optional_note', required: false },
      ],
    } as AutoHealing.Playbook;

    expect(
      getMissingRequiredVariableNames(playbook, { env: 'prod', region: '' }),
    ).toEqual(['region']);
    expect(getExecutionRunIdOrThrow({ data: { id: 'run-1' } })).toBe('run-1');
    expect(() => getExecutionRunIdOrThrow({ data: {} })).toThrow(EXECUTION_RUN_ID_MISSING_ERROR);
  });
});
