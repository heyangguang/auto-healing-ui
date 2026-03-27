import React from 'react';
import { render, screen } from '@testing-library/react';
import PlaybookVariablesPanel from './PlaybookVariablesPanel';

const baseVariable = {
  name: 'deploy_mode',
  type: 'string',
  required: false,
  default: 'before-default',
  description: 'before-description',
  pattern: '',
  min: undefined,
  max: undefined,
  enum: [],
} as AutoHealing.PlaybookVariable;

describe('PlaybookVariablesPanel', () => {
  it('remounts uncontrolled cells when parent state rolls back values', () => {
    const onAutoSave = jest.fn();
    const { rerender } = render(
      <PlaybookVariablesPanel
        canManage
        deferredVariables={[baseVariable]}
        editedVariables={[baseVariable]}
        isVariablesStale={false}
        onAutoSave={onAutoSave}
      />,
    );

    expect(screen.getByDisplayValue('before-default')).toBeTruthy();
    expect(screen.getByDisplayValue('before-description')).toBeTruthy();

    const rolledBackVariable = {
      ...baseVariable,
      default: 'after-default',
      description: 'after-description',
    };

    rerender(
      <PlaybookVariablesPanel
        canManage
        deferredVariables={[rolledBackVariable]}
        editedVariables={[rolledBackVariable]}
        isVariablesStale={false}
        onAutoSave={onAutoSave}
      />,
    );

    expect(screen.queryByDisplayValue('before-default')).toBeNull();
    expect(screen.queryByDisplayValue('before-description')).toBeNull();
    expect(screen.getByDisplayValue('after-default')).toBeTruthy();
    expect(screen.getByDisplayValue('after-description')).toBeTruthy();
  });
});
