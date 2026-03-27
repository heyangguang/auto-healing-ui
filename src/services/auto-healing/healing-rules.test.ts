import {
  activateHealingRule,
  createHealingRule,
  getHealingRule,
  getHealingRules,
} from './healing-rules';
import {
  getTenantHealingRules,
  getTenantHealingRulesId,
  postTenantHealingRules,
  postTenantHealingRulesIdActivate,
} from '@/services/generated/auto-healing/healingRules';

jest.mock('@/services/generated/auto-healing/healingRules', () => ({
  getTenantHealingRules: jest.fn(),
  postTenantHealingRules: jest.fn(),
  getTenantHealingRulesId: jest.fn(),
  postTenantHealingRulesIdActivate: jest.fn(),
}));

describe('auto-healing healing-rules service', () => {
  it('delegates stable healing-rule wrappers to the generated healing-rules client', async () => {
    await getHealingRules({ page: 1, page_size: 20, is_active: true });
    await createHealingRule({} as AutoHealing.CreateHealingRuleRequest);
    await getHealingRule('rule-1');
    await activateHealingRule('rule-1');

    expect(getTenantHealingRules).toHaveBeenCalledWith({
      page: 1,
      page_size: 20,
      is_active: true,
    }, undefined);
    expect(postTenantHealingRules).toHaveBeenCalledWith({
      data: {},
      headers: { 'Content-Type': 'application/json' },
    });
    expect(getTenantHealingRulesId).toHaveBeenCalledWith({ id: 'rule-1' }, undefined);
    expect(postTenantHealingRulesIdActivate).toHaveBeenCalledWith({ id: 'rule-1' }, undefined);
  });
});
