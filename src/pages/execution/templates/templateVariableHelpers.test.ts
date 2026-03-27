import {
  buildInitialVariableValues,
  buildSubmissionVariableValues,
  getPlaybookVariables,
} from './templateVariableHelpers';

jest.mock('@/components/VariableInput', () => ({
  extractDefaultValue: jest.fn((value) => value ?? null),
}));

describe('templateVariableHelpers', () => {
  it('prefers declared variables and falls back to scanned variables', () => {
    expect(
      getPlaybookVariables({
        variables: [{ name: 'declared', type: 'string' }],
        scanned_variables: [{ name: 'scanned', type: 'string' }],
      } as unknown as AutoHealing.Playbook),
    ).toEqual([{ name: 'declared', type: 'string' }]);

    expect(
      getPlaybookVariables({
        variables: [],
        scanned_variables: [{ name: 'scanned', type: 'string' }],
      } as unknown as AutoHealing.Playbook),
    ).toEqual([{ name: 'scanned', type: 'string' }]);
  });

  it('normalizes number and boolean values when building initial values', () => {
    const playbook = {
      variables: [
        { name: 'port', type: 'number', default: '8080' },
        { name: 'enabled', type: 'boolean', default: 'true' },
        { name: 'label', type: 'string', default: 'edge' },
      ],
    } as unknown as AutoHealing.Playbook;

    expect(
      buildInitialVariableValues(playbook, {
        port: '9090',
        enabled: 'false',
      }),
    ).toEqual({
      port: 9090,
      enabled: false,
      label: 'edge',
    });
  });

  it('normalizes submission values and respects omit options', () => {
    const playbook = {
      variables: [
        { name: 'port', type: 'number' },
        { name: 'enabled', type: 'boolean' },
        { name: 'config', type: 'object' },
        { name: 'metadata', type: 'dict' },
      ],
    } as unknown as AutoHealing.Playbook;

    expect(
      buildSubmissionVariableValues(
        playbook,
        {
          port: '8080',
          enabled: 'true',
          config: '{"dryRun":true}',
          metadata: { env: 'prod' },
          blank: '',
          emptyObject: {},
          unknown: 'keep-me',
        },
        {
          includeUnknown: false,
          omitBlankString: true,
          omitEmptyCollection: true,
        },
      ),
    ).toEqual({
      port: 8080,
      enabled: true,
      config: { dryRun: true },
      metadata: { env: 'prod' },
    });
  });
});
