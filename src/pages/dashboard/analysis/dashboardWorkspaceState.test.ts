import type { DashboardState } from '../dashboardStore';
import {
  buildStateAfterSavingSystemWorkspace,
  mergeSystemWorkspaces,
} from './dashboardWorkspaceState';

const buildState = (workspaces: DashboardState['workspaces'], activeWorkspaceId: string): DashboardState => ({
  workspaces,
  activeWorkspaceId,
});

describe('dashboardWorkspaceState helpers', () => {
  it('drops stale system workspaces when backend returns none', () => {
    const nextState = mergeSystemWorkspaces(
      buildState(
        [
          { id: 'sys-1', name: '系统', widgets: [], layouts: [], isSystem: true },
          { id: 'ws-1', name: '我的工作区', widgets: [], layouts: [] },
        ],
        'sys-1',
      ),
      [],
    );

    expect(nextState.workspaces).toEqual([
      { id: 'ws-1', name: '我的工作区', widgets: [], layouts: [] },
    ]);
    expect(nextState.activeWorkspaceId).toBe('ws-1');
  });

  it('replaces the saved workspace without producing an empty active state', () => {
    const { nextState, synced } = buildStateAfterSavingSystemWorkspace(
      buildState(
        [{ id: 'default', name: '默认工作区', widgets: [{ instanceId: 'w-1', widgetId: 'stat-1' }], layouts: [{ i: 'w-1', x: 0, y: 0, w: 2, h: 2 }] }],
        'default',
      ),
      'default',
      [{ id: 'server-1', is_default: true, name: '系统工作区', config: { widgets: [{ instanceId: 'w-1', widgetId: 'stat-1' }], layouts: [{ i: 'w-1', x: 0, y: 0, w: 2, h: 2 }] } }],
      'server-1',
    );

    expect(synced).toBe(true);
    expect(nextState.workspaces).toEqual([
      {
        id: 'sys-server-1',
        name: '系统工作区',
        widgets: [{ instanceId: 'w-1', widgetId: 'stat-1' }],
        layouts: [{ i: 'w-1', x: 0, y: 0, w: 2, h: 2 }],
        isDefault: true,
        isSystem: true,
        isReadOnly: false,
      },
    ]);
    expect(nextState.activeWorkspaceId).toBe('sys-server-1');
  });

  it('keeps the previous workspace when config refresh succeeds but still returns the old list', () => {
    const previousState = buildState(
      [{ id: 'default', name: '默认工作区', widgets: [{ instanceId: 'w-1', widgetId: 'stat-1' }], layouts: [{ i: 'w-1', x: 0, y: 0, w: 2, h: 2 }] }],
      'default',
    );

    const { nextState, synced } = buildStateAfterSavingSystemWorkspace(
      previousState,
      'default',
      [],
      'server-1',
    );

    expect(synced).toBe(false);
    expect(nextState).toEqual(previousState);
  });
});
