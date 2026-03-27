import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { useGitRepoDrawerState } from './useGitRepoDrawerState';
import { getFiles } from '@/services/auto-healing/git-repos';

jest.mock('@/services/auto-healing/git-repos', () => ({
  deleteGitRepo: jest.fn(),
  getCommits: jest.fn(),
  getFiles: jest.fn(),
  getGitRepo: jest.fn(),
  getSyncLogs: jest.fn(),
  syncGitRepo: jest.fn(),
}));

jest.mock('@/services/auto-healing/playbooks', () => ({
  getPlaybooks: jest.fn(),
}));

jest.mock('@/utils/fetchAllPages', () => ({
  fetchAllPages: jest.fn(async (loader: (page: number, pageSize: number) => Promise<any>) => {
    const response = await loader(1, 100);
    if (Array.isArray(response)) {
      return response;
    }
    return response.data || [];
  }),
}));

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function Harness() {
  const state = useGitRepoDrawerState({ triggerRefresh: jest.fn() });

  return React.createElement(
    React.Fragment,
    null,
    React.createElement(
      'button',
      { type: 'button', onClick: () => void state.loadFileContent('repo-1', 'site.yml') },
      'load-content',
    ),
    React.createElement(
      'button',
      { type: 'button', onClick: () => void state.loadFileTree('repo-1') },
      'refresh-tree',
    ),
    React.createElement('div', { 'data-testid': 'selected-path' }, state.selectedFilePath),
    React.createElement('div', { 'data-testid': 'file-content' }, state.fileContent),
  );
}

describe('useGitRepoDrawerState', () => {
  it('invalidates stale file content responses when refreshing the file tree', async () => {
    const staleContent = createDeferred<{ content: string }>();

    (getFiles as jest.Mock).mockImplementation((_id: string, path?: string) => {
      if (path) {
        return staleContent.promise;
      }
      return Promise.resolve({ files: [] });
    });

    render(React.createElement(Harness));

    await act(async () => {
      fireEvent.click(screen.getByText('load-content'));
    });
    await act(async () => {
      fireEvent.click(screen.getByText('refresh-tree'));
    });

    await act(async () => {
      staleContent.resolve({ content: 'stale-file-content' });
      await staleContent.promise;
    });

    expect(screen.getByTestId('selected-path').textContent).toBe('');
    expect(screen.getByTestId('file-content').textContent).toBe('');
  });
});
