import { mapFlowResponseToGraph } from './flowEditorGraph';

describe('mapFlowResponseToGraph', () => {
    it('normalizes legacy task fields onto execution nodes', () => {
        const mapped = mapFlowResponseToGraph({
            id: 'flow-1',
            name: '旧版任务字段流程',
            is_active: true,
            nodes: [{
                id: 'exec-1',
                type: 'execution',
                name: '执行恢复',
                config: {
                    task_id: 'task-1',
                    task_name: '磁盘恢复模板',
                },
                position: { x: 0, y: 0 },
            }],
            edges: [],
        } as unknown as AutoHealing.HealingFlow, jest.fn());

        expect(mapped.nodes[0]?.data.task_template_id).toBe('task-1');
        expect(mapped.nodes[0]?.data.task_template_name).toBe('磁盘恢复模板');
    });
});
