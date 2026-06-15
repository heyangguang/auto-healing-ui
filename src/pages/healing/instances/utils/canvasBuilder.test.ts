import { buildCanvasElements } from './canvasBuilder';

describe('buildCanvasElements', () => {
  it('使用标准 source/target 边格式构建画布', () => {
    const { edges, nodes } = buildCanvasElements({
      flowNodes: [
        {
          id: 'start',
          type: 'start',
          name: '开始',
          position: { x: 0, y: 0 },
          config: {},
        },
        {
          id: 'extract',
          type: 'host_extractor',
          name: '提取工单主机',
          position: { x: 0, y: 80 },
          config: {},
        },
        {
          id: 'exec',
          type: 'execution',
          name: '执行恢复',
          position: { x: 0, y: 160 },
          config: {},
        },
        {
          id: 'end',
          type: 'end',
          name: '结束',
          position: { x: 0, y: 240 },
          config: {},
        },
      ],
      flowEdges: [
        { source: 'start', target: 'extract' } as AutoHealing.FlowEdge,
        { source: 'extract', target: 'exec' } as AutoHealing.FlowEdge,
        {
          source: 'exec',
          sourceHandle: 'success',
          target: 'end',
        } as AutoHealing.FlowEdge,
      ],
      nodeStates: {
        end: { status: 'completed' },
        exec: { status: 'completed' },
        extract: { status: 'completed' },
        start: { status: 'completed' },
      },
      currentNodeId: 'end',
    });

    expect(edges).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ source: 'start', target: 'extract' }),
        expect.objectContaining({ source: 'extract', target: 'exec' }),
        expect.objectContaining({
          source: 'exec',
          sourceHandle: 'success',
          target: 'end',
        }),
      ]),
    );
    expect(edges.every((edge) => edge.source && edge.target)).toBe(true);

    const nodeMap = Object.fromEntries(nodes.map((node) => [node.id, node]));
    expect(nodeMap.start?.data.activeHandles).toContain('default');
    expect(nodeMap.exec?.data.activeHandles).toContain('success');
  });

  it('高亮带 default sourceHandle 的线性前置路径', () => {
    const { edges, nodes } = buildCanvasElements({
      flowNodes: [
        {
          id: 'start',
          type: 'start',
          name: '开始',
          position: { x: 0, y: 0 },
          config: {},
        },
        {
          id: 'extract',
          type: 'host_extractor',
          name: '提取工单主机',
          position: { x: 0, y: 80 },
          config: {},
        },
        {
          id: 'cmdb',
          type: 'cmdb_validator',
          name: 'CMDB验证',
          position: { x: 0, y: 160 },
          config: {},
        },
        {
          id: 'approval',
          type: 'approval',
          name: '人工审批',
          position: { x: 0, y: 240 },
          config: {},
        },
        {
          id: 'exec',
          type: 'execution',
          name: '执行磁盘恢复',
          position: { x: 0, y: 320 },
          config: {},
        },
        {
          id: 'end',
          type: 'end',
          name: '结束',
          position: { x: 0, y: 400 },
          config: {},
        },
      ],
      flowEdges: [
        {
          id: 'start-extract',
          source: 'start',
          sourceHandle: 'default',
          target: 'extract',
        },
        {
          id: 'extract-cmdb',
          source: 'extract',
          sourceHandle: 'default',
          target: 'cmdb',
        },
        {
          id: 'cmdb-approval',
          source: 'cmdb',
          sourceHandle: 'default',
          target: 'approval',
        },
        {
          id: 'approval-approved',
          source: 'approval',
          sourceHandle: 'approved',
          target: 'exec',
        },
        {
          id: 'approval-rejected',
          source: 'approval',
          sourceHandle: 'rejected',
          target: 'end',
        },
        {
          id: 'exec-success',
          source: 'exec',
          sourceHandle: 'success',
          target: 'end',
        },
      ],
      nodeStates: {
        approval: { status: 'approved' },
        exec: { status: 'completed' },
        end: { status: 'completed' },
      },
      currentNodeId: 'end',
    });

    const edgeMap = Object.fromEntries(edges.map((edge) => [edge.id, edge]));
    expect(edgeMap['start-extract']?.animated).toBe(true);
    expect(edgeMap['extract-cmdb']?.animated).toBe(true);
    expect(edgeMap['cmdb-approval']?.animated).toBe(true);
    expect(edgeMap['approval-approved']?.animated).toBe(true);
    expect(edgeMap['exec-success']?.animated).toBe(true);
    expect(edgeMap['approval-rejected']?.animated).toBe(false);
    expect(edgeMap['approval-rejected']?.style?.strokeDasharray).toBe('5 3');

    const nodeMap = Object.fromEntries(nodes.map((node) => [node.id, node]));
    expect(nodeMap.start?.data.status).toBe('success');
    expect(nodeMap.extract?.data.status).toBe('success');
    expect(nodeMap.cmdb?.data.status).toBe('success');
    expect(nodeMap.start?.data.activeHandles).toContain('default');
    expect(nodeMap.extract?.data.activeHandles).toContain('default');
    expect(nodeMap.cmdb?.data.activeHandles).toContain('default');
  });

  it('不会把汇聚到结束节点的未执行通知分支误判为成功', () => {
    const { edges, nodes } = buildCanvasElements({
      flowNodes: [
        {
          id: 'start',
          type: 'start',
          name: '开始',
          position: { x: 0, y: 0 },
          config: {},
        },
        {
          id: 'approval',
          type: 'approval',
          name: '人工审批',
          position: { x: 0, y: 80 },
          config: {},
        },
        {
          id: 'exec',
          type: 'execution',
          name: '执行恢复',
          position: { x: 0, y: 160 },
          config: {},
        },
        {
          id: 'notify-success',
          type: 'notification',
          name: '通知-恢复完成',
          position: { x: 0, y: 240 },
          config: {},
        },
        {
          id: 'notify-failed',
          type: 'notification',
          name: '通知-恢复失败',
          position: { x: 160, y: 240 },
          config: {},
        },
        {
          id: 'notify-rejected',
          type: 'notification',
          name: '通知-审批拒绝',
          position: { x: -160, y: 240 },
          config: {},
        },
        {
          id: 'end',
          type: 'end',
          name: '结束',
          position: { x: 0, y: 320 },
          config: {},
        },
      ],
      flowEdges: [
        {
          id: 'start-approval',
          source: 'start',
          sourceHandle: 'default',
          target: 'approval',
        },
        {
          id: 'approval-approved',
          source: 'approval',
          sourceHandle: 'approved',
          target: 'exec',
        },
        {
          id: 'approval-rejected',
          source: 'approval',
          sourceHandle: 'rejected',
          target: 'notify-rejected',
        },
        {
          id: 'exec-success',
          source: 'exec',
          sourceHandle: 'success',
          target: 'notify-success',
        },
        {
          id: 'exec-failed',
          source: 'exec',
          sourceHandle: 'failed',
          target: 'notify-failed',
        },
        {
          id: 'notify-success-end',
          source: 'notify-success',
          sourceHandle: 'default',
          target: 'end',
        },
        {
          id: 'notify-failed-end',
          source: 'notify-failed',
          sourceHandle: 'default',
          target: 'end',
        },
        {
          id: 'notify-rejected-end',
          source: 'notify-rejected',
          sourceHandle: 'default',
          target: 'end',
        },
      ],
      nodeStates: {
        approval: { status: 'approved' },
        exec: { status: 'completed' },
        end: { status: 'completed' },
      },
      currentNodeId: 'end',
    });

    const edgeMap = Object.fromEntries(edges.map((edge) => [edge.id, edge]));
    expect(edgeMap['approval-approved']?.animated).toBe(true);
    expect(edgeMap['exec-success']?.animated).toBe(true);
    expect(edgeMap['notify-success-end']?.animated).toBe(true);
    expect(edgeMap['approval-rejected']?.animated).toBe(false);
    expect(edgeMap['approval-rejected']?.style?.strokeDasharray).toBe('5 3');
    expect(edgeMap['exec-failed']?.animated).toBe(false);
    expect(edgeMap['exec-failed']?.style?.strokeDasharray).toBe('5 3');
    expect(edgeMap['notify-failed-end']?.animated).toBe(false);
    expect(
      edgeMap['notify-failed-end']?.style?.strokeDasharray,
    ).toBeUndefined();
    expect(edgeMap['notify-rejected-end']?.animated).toBe(false);
    expect(
      edgeMap['notify-rejected-end']?.style?.strokeDasharray,
    ).toBeUndefined();

    const nodeMap = Object.fromEntries(nodes.map((node) => [node.id, node]));
    expect(nodeMap['notify-success']?.data.status).toBe('success');
    expect(nodeMap['notify-failed']?.data.status).toBeUndefined();
    expect(nodeMap['notify-rejected']?.data.status).toBeUndefined();
  });

  it('保留执行节点的标准 task_template 字段', () => {
    const { nodes } = buildCanvasElements({
      flowNodes: [
        {
          id: 'exec',
          type: 'execution',
          name: '执行磁盘恢复',
          position: { x: 0, y: 0 },
          config: {
            task_template_id: 'task-1',
            task_template_name: '磁盘恢复模板',
          },
        },
      ],
      flowEdges: [],
      nodeStates: {},
      currentNodeId: null,
    });

    expect(nodes[0]?.data.task_template_id).toBe('task-1');
    expect(nodes[0]?.data.task_template_name).toBe('磁盘恢复模板');
  });
});
