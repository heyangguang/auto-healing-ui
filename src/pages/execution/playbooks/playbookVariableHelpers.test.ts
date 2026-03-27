import {
  normalizeVariableEditorType,
  parseDefaultValue,
  variableTypeConfig,
} from './playbookVariableHelpers';

describe('playbookVariableHelpers', () => {
  it('normalizes legacy editor types to supported UI editors', () => {
    expect(normalizeVariableEditorType('dict')).toBe('object');
    expect(normalizeVariableEditorType('choice')).toBe('enum');
    expect(normalizeVariableEditorType('string')).toBe('string');
  });

  it('exposes UI metadata for dict and choice variable types', () => {
    expect(variableTypeConfig.dict.text).toBe('字典');
    expect(variableTypeConfig.choice.text).toBe('选择');
  });

  it('extracts templated default values while keeping falsy literals visible', () => {
    expect(parseDefaultValue("{{ level | default('basic') }}")).toBe('basic');
    expect(parseDefaultValue(false)).toBe('false');
    expect(parseDefaultValue(0)).toBe('0');
  });
});
