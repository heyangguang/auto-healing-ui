import {
  normalizeRuleConditionsForForm,
  normalizeRuleConditionsForPayload,
} from './ruleConditionHelpers';

describe('rule condition helpers', () => {
  it('serializes backend in-list arrays for the form editor', () => {
    expect(
      normalizeRuleConditionsForForm([
        {
          field: 'status',
          operator: 'in',
          type: 'condition',
          value: ['new', 'assigned'],
        },
      ]),
    ).toEqual([
      {
        field: 'status',
        operator: 'in',
        type: 'condition',
        value: 'new, assigned',
      },
    ]);
  });

  it('converts form comma lists to backend in-list arrays recursively', () => {
    expect(
      normalizeRuleConditionsForPayload([
        {
          conditions: [
            {
              field: 'severity',
              operator: 'in',
              type: 'condition',
              value: 'critical, high',
            },
          ],
          logic: 'OR',
          type: 'group',
        },
      ]),
    ).toEqual([
      {
        conditions: [
          {
            field: 'severity',
            operator: 'in',
            type: 'condition',
            value: ['critical', 'high'],
          },
        ],
        logic: 'OR',
        type: 'group',
      },
    ]);
  });
});
