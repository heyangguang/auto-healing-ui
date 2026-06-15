function stringifyConditionValue(
  value: AutoHealing.ConditionValue,
): AutoHealing.ConditionValue {
  if (Array.isArray(value)) {
    return value.map((item) => String(item)).join(', ');
  }
  return value;
}

function splitListValue(value: AutoHealing.ConditionValue): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  return String(value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function normalizeRuleConditionsForForm(
  conditions: AutoHealing.HealingRuleCondition[] = [],
): AutoHealing.HealingRuleCondition[] {
  return conditions.map((condition) => {
    if (condition.type === 'group') {
      return {
        ...condition,
        conditions: normalizeRuleConditionsForForm(condition.conditions || []),
      };
    }
    if (condition.operator === 'in') {
      return {
        ...condition,
        value: stringifyConditionValue(condition.value),
      };
    }
    return { ...condition };
  });
}

export function normalizeRuleConditionsForPayload(
  conditions: AutoHealing.HealingRuleCondition[] = [],
): AutoHealing.HealingRuleCondition[] {
  return conditions.map((condition) => {
    if (condition.type === 'group') {
      return {
        ...condition,
        conditions: normalizeRuleConditionsForPayload(
          condition.conditions || [],
        ),
      };
    }
    if (condition.operator === 'in') {
      return {
        ...condition,
        value: splitListValue(condition.value),
      };
    }
    return { ...condition };
  });
}
