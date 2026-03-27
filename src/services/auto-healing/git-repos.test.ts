import {
  createGitRepo,
  getFiles,
  getGitRepo,
  getGitRepoStats,
  getGitRepos,
  getCommits,
  getSyncLogs,
  syncGitRepo,
  validateGitRepo,
} from './git-repos';
import { request } from '@umijs/max';
import {
  getTenantGitRepos,
  postTenantGitRepos,
  postTenantGitReposIdSync,
} from '@/services/generated/auto-healing/gitPlaybooks';

jest.mock('@umijs/max', () => ({
  request: jest.fn(),
}));

jest.mock('@/services/generated/auto-healing/gitPlaybooks', () => ({
  getTenantGitRepos: jest.fn(),
  postTenantGitRepos: jest.fn(),
  postTenantGitReposIdSync: jest.fn(),
}));

describe('auto-healing git-repos service', () => {
  it('delegates stable git repository wrappers to the generated git/playbook client', async () => {
    await getGitRepos({ page: 1, page_size: 20, status: 'ready' });
    await createGitRepo({} as AutoHealing.CreateGitRepoRequest);
    await syncGitRepo('repo-1');

    expect(getTenantGitRepos).toHaveBeenCalledWith({
      params: { page: 1, page_size: 20, status: 'ready' },
    });
    expect(postTenantGitRepos).toHaveBeenCalledWith({ data: {} });
    expect(postTenantGitReposIdSync).toHaveBeenCalledWith({ id: 'repo-1' });
  });

  it('unwraps request-based git helpers to stable shapes', async () => {
    (request as jest.Mock)
      .mockResolvedValueOnce({ data: { branches: ['main'], default_branch: 'main' } })
      .mockResolvedValueOnce({ data: { id: 'repo-1', name: 'infra', status: 'ready' } })
      .mockResolvedValueOnce({ data: { files: [{ path: 'playbooks/site.yml', name: 'site.yml', type: 'file' }], path: '', content: '' } })
      .mockResolvedValueOnce({ data: [{ commit_id: 'abc123', full_id: 'abc123def456', message: 'init', author: 'ops', author_email: 'ops@example.com', date: '2026-03-26T00:00:00Z' }] })
      .mockResolvedValueOnce({ data: [{ id: 'log-1', status: 'success', created_at: '2026-03-26T00:00:00Z' }], total: 1, page: 1, page_size: 10 })
      .mockResolvedValueOnce({ data: { total: 3, by_status: [{ status: 'ready', count: 2 }] } });

    await expect(validateGitRepo({ url: 'https://example.com/repo.git' })).resolves.toEqual({
      branches: ['main'],
      default_branch: 'main',
    });
    await expect(getGitRepo('repo-1')).resolves.toEqual({ id: 'repo-1', name: 'infra', status: 'ready' });
    await expect(getFiles('repo-1')).resolves.toEqual({
      files: [{ path: 'playbooks/site.yml', name: 'site.yml', type: 'file' }],
      path: '',
      content: '',
    });
    await expect(getCommits('repo-1')).resolves.toEqual([
      {
        commit_id: 'abc123',
        full_id: 'abc123def456',
        message: 'init',
        author: 'ops',
        author_email: 'ops@example.com',
        date: '2026-03-26T00:00:00Z',
      },
    ]);
    await expect(getSyncLogs('repo-1', { page: 1, page_size: 10 })).resolves.toEqual({
      data: [{ id: 'log-1', status: 'success', created_at: '2026-03-26T00:00:00Z' }],
      total: 1,
      page: 1,
      page_size: 10,
    });
    await expect(getGitRepoStats()).resolves.toEqual({
      total: 3,
      by_status: [{ status: 'ready', count: 2 }],
    });
    expect(request).toHaveBeenCalledWith('/api/v1/tenant/git-repos/repo-1/commits', {
      method: 'GET',
      params: { limit: 10 },
    });
  });
});
