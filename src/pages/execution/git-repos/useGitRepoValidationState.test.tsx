import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { message } from 'antd';
import { useGitRepoValidationState } from './useGitRepoValidationState';
import { validateGitRepo } from '@/services/auto-healing/git-repos';

jest.mock('@/services/auto-healing/git-repos', () => ({
  validateGitRepo: jest.fn(),
}));

describe('useGitRepoValidationState', () => {
  beforeEach(() => {
    jest.spyOn(message, 'success').mockImplementation(jest.fn());
    jest.spyOn(message, 'error').mockImplementation(jest.fn());
    jest.spyOn(message, 'warning').mockImplementation(jest.fn());
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  function createDeferred<T>() {
    let resolve!: (value: T) => void;
    let reject!: (error: unknown) => void;
    const promise = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, reject, resolve };
  }

  function Harness() {
    const form = React.useMemo(() => ({
      getFieldsValue: jest.fn(() => ({
        auth_type: 'none',
        url: 'https://example.com/repo.git',
      })),
      setFieldValue: jest.fn(),
      validateFields: jest.fn().mockResolvedValue(undefined),
    }), []);

    const state = useGitRepoValidationState({ form: form as any });

    return React.createElement(
      React.Fragment,
      null,
      React.createElement(
        'button',
        {
          type: 'button',
          onClick: () => void state.handleValidate(),
        },
        'validate',
      ),
      React.createElement(
        'button',
        {
          type: 'button',
          onClick: () => state.resetValidation(),
        },
        'reset',
      ),
      React.createElement('div', { 'data-testid': 'validated' }, String(state.validated)),
      React.createElement('div', { 'data-testid': 'default-branch' }, state.defaultBranch),
      React.createElement('div', { 'data-testid': 'branch-count' }, String(state.availableBranches.length)),
      React.createElement('div', { 'data-testid': 'validating' }, String(state.validating)),
    );
  }

  it('applies validation results instead of invalidating its own request', async () => {
    (validateGitRepo as jest.Mock).mockResolvedValue({
      branches: ['main', 'release'],
      default_branch: 'main',
    });

    render(React.createElement(Harness));

    await act(async () => {
      fireEvent.click(screen.getByText('validate'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('validated').textContent).toBe('true');
      expect(screen.getByTestId('default-branch').textContent).toBe('main');
      expect(screen.getByTestId('branch-count').textContent).toBe('2');
      expect(screen.getByTestId('validating').textContent).toBe('false');
    });
  });

  it('clears validating immediately when a pending validation is invalidated', async () => {
    const deferred = createDeferred<{ branches: string[]; default_branch: string }>();
    (validateGitRepo as jest.Mock).mockReturnValue(deferred.promise);

    render(React.createElement(Harness));

    await act(async () => {
      fireEvent.click(screen.getByText('validate'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('validating').textContent).toBe('true');
    });

    await act(async () => {
      fireEvent.click(screen.getByText('reset'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('validating').textContent).toBe('false');
      expect(screen.getByTestId('validated').textContent).toBe('false');
    });

    await act(async () => {
      deferred.resolve({ branches: ['main'], default_branch: 'main' });
      await deferred.promise;
    });

    expect(screen.getByTestId('validating').textContent).toBe('false');
  });
});
