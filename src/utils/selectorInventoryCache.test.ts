import {
  clearSelectorInventoryCache,
  getCachedGitRepoInventory,
  getCachedNotificationChannelInventory,
  getCachedPlaybookInventory,
  invalidateSelectorInventory,
  selectorInventoryKeys,
} from './selectorInventoryCache';
import { getGitRepos } from '@/services/auto-healing/git-repos';
import { getChannels } from '@/services/auto-healing/notification';
import { getPlaybooks } from '@/services/auto-healing/playbooks';

jest.mock('@/services/auto-healing/git-repos', () => ({
  getGitRepos: jest.fn(),
}));

jest.mock('@/services/auto-healing/playbooks', () => ({
  getPlaybooks: jest.fn(),
}));

jest.mock('@/services/auto-healing/notification', () => ({
  getChannels: jest.fn(),
  getTemplates: jest.fn(),
}));

describe('selectorInventoryCache', () => {
  beforeEach(() => {
    clearSelectorInventoryCache();
    jest.clearAllMocks();
  });

  it('dedupes concurrent inventory requests', async () => {
    let resolveFirstPage:
      | ((value: { data: AutoHealing.GitRepository[]; total: number }) => void)
      | undefined;

    (getGitRepos as jest.Mock).mockImplementation(() => new Promise((resolve) => {
      resolveFirstPage = resolve;
    }));

    const pendingA = getCachedGitRepoInventory();
    const pendingB = getCachedGitRepoInventory();

    expect(getGitRepos).toHaveBeenCalledTimes(1);

    resolveFirstPage?.({
      data: [{ id: 'repo-1', name: 'Repo 1' } as AutoHealing.GitRepository],
      total: 1,
    });

    await expect(Promise.all([pendingA, pendingB])).resolves.toEqual([
      [{ id: 'repo-1', name: 'Repo 1' }],
      [{ id: 'repo-1', name: 'Repo 1' }],
    ]);
  });

  it('reuses resolved inventory until invalidated', async () => {
    (getPlaybooks as jest.Mock).mockResolvedValue({
      data: [{ id: 'pb-1', name: 'Playbook 1' }],
      total: 1,
    });

    await expect(getCachedPlaybookInventory()).resolves.toEqual([
      { id: 'pb-1', name: 'Playbook 1' },
    ]);
    await expect(getCachedPlaybookInventory()).resolves.toEqual([
      { id: 'pb-1', name: 'Playbook 1' },
    ]);

    expect(getPlaybooks).toHaveBeenCalledTimes(1);

    invalidateSelectorInventory(selectorInventoryKeys.playbooks);

    await getCachedPlaybookInventory();

    expect(getPlaybooks).toHaveBeenCalledTimes(2);
  });

  it('keeps inventory domains isolated', async () => {
    (getGitRepos as jest.Mock).mockResolvedValue({
      data: [{ id: 'repo-1', name: 'Repo 1' }],
      total: 1,
    });
    (getChannels as jest.Mock).mockResolvedValue({
      data: [{ id: 'channel-1', name: 'Channel 1' }],
      total: 1,
    });

    await getCachedGitRepoInventory();
    await getCachedNotificationChannelInventory();

    expect(getGitRepos).toHaveBeenCalledTimes(1);
    expect(getChannels).toHaveBeenCalledTimes(1);
  });
});
