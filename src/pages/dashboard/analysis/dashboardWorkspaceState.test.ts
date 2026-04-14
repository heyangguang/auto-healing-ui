import type { DashboardState } from '../dashboardStore';
import { getDefaultWorkspace } from '../dashboardStore';
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

  it('keeps default and user workspaces when system workspaces are merged in', () => {
    const nextState = mergeSystemWorkspaces(
      buildState(
        [
          { id: 'default', name: '运维总览', widgets: [], layouts: [] },
          { id: 'ws-1', name: '我的工作区', widgets: [], layouts: [] },
        ],
        'default',
      ),
      [{ id: 'server-1', is_default: true, name: '系统工作区', config: { widgets: [], layouts: [] } }],
    );

    expect(nextState.workspaces).toEqual([
      {
        id: 'sys-server-1',
        name: '系统工作区',
        widgets: [],
        layouts: [],
        isDefault: true,
        isSystem: true,
        isReadOnly: false,
      },
      { id: 'default', name: '运维总览', widgets: [], layouts: [] },
      { id: 'ws-1', name: '我的工作区', widgets: [], layouts: [] },
    ]);
    expect(nextState.activeWorkspaceId).toBe('default');
  });

  it('upgrades the legacy system default overview layout during merge', () => {
    const nextState = mergeSystemWorkspaces(
      buildState(
        [{ id: 'default', name: '运维总览', widgets: [], layouts: [] }],
        'default',
      ),
      [{
        id: 'server-1',
        is_default: true,
        name: '系统工作区',
        config: {
          widgets: [
            { instanceId: 'w-1', widgetId: 'stat-incident-total' },
            { instanceId: 'w-2', widgetId: 'stat-healing-rate' },
            { instanceId: 'w-3', widgetId: 'stat-pending-items' },
            { instanceId: 'w-4', widgetId: 'stat-exec-success' },
            { instanceId: 'w-5', widgetId: 'chart-incident-status' },
            { instanceId: 'w-6', widgetId: 'chart-instance-status' },
            { instanceId: 'w-7', widgetId: 'list-recent-instances' },
            { instanceId: 'w-8', widgetId: 'list-pending-approvals' },
          ],
          layouts: [
            { i: 'w-1', x: 0, y: 0, w: 3, h: 2, minW: 2, minH: 2 },
            { i: 'w-2', x: 3, y: 0, w: 3, h: 2, minW: 2, minH: 2 },
            { i: 'w-3', x: 6, y: 0, w: 3, h: 2, minW: 2, minH: 2 },
            { i: 'w-4', x: 9, y: 0, w: 3, h: 2, minW: 2, minH: 2 },
            { i: 'w-5', x: 0, y: 2, w: 4, h: 5, minW: 4, minH: 3 },
            { i: 'w-6', x: 4, y: 2, w: 4, h: 5, minW: 4, minH: 3 },
            { i: 'w-7', x: 0, y: 7, w: 8, h: 5, minW: 4, minH: 3 },
            { i: 'w-8', x: 8, y: 2, w: 4, h: 10, minW: 4, minH: 3 },
          ],
        },
      }],
    );

    const defaultWorkspace = getDefaultWorkspace();
    expect(nextState.workspaces[0]).toEqual({
      id: 'sys-server-1',
      name: '系统工作区',
      widgets: defaultWorkspace.widgets,
      layouts: defaultWorkspace.layouts,
      isDefault: true,
      isSystem: true,
      isReadOnly: false,
    });
  });

  it('removes the converted local workspace and focuses the new system workspace', () => {
    const { nextState, synced } = buildStateAfterSavingSystemWorkspace(
      buildState(
        [
          { id: 'default', name: '默认工作区', widgets: [{ instanceId: 'w-1', widgetId: 'stat-1' }], layouts: [{ i: 'w-1', x: 0, y: 0, w: 2, h: 2 }] },
          { id: 'ws-1', name: '我的工作区', widgets: [], layouts: [] },
        ],
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
      {
        id: 'ws-1',
        name: '我的工作区',
        widgets: [],
        layouts: [],
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
