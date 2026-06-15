import {
  getVariableTypeLabel,
  normalizeVariableEditorType,
  parseDefaultValue,
  variableTypeConfig,
  variableTypeOptions,
} from './playbookVariableHelpers';

describe('playbookVariableHelpers', () => {
  it('normalizes legacy editor types to supported UI editors', () => {
    expect(normalizeVariableEditorType('dict')).toBe('object');
    expect(normalizeVariableEditorType('choice')).toBe('enum');
    expect(normalizeVariableEditorType('integer')).toBe('number');
    expect(normalizeVariableEditorType('string')).toBe('string');
  });

  it('keeps alias variable types out of the visible type picker', () => {
    expect(variableTypeConfig.object.text).toBe('对象');
    expect(variableTypeConfig.enum.text).toBe('枚举');
    expect(getVariableTypeLabel('dict')).toBe('对象');
    expect(getVariableTypeLabel('choice')).toBe('枚举');
    expect(variableTypeOptions.map((option) => option.value)).not.toContain(
      'dict',
    );
    expect(variableTypeOptions.map((option) => option.value)).not.toContain(
      'choice',
    );
  });

  it('extracts templated default values while keeping falsy literals visible', () => {
    expect(parseDefaultValue("{{ level | default('basic') }}")).toBe('basic');
    expect(parseDefaultValue(false)).toBe('false');
    expect(parseDefaultValue(0)).toBe('0');
  });
});
