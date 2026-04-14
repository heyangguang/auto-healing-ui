import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { getExecutionTask } from '@/services/auto-healing/execution';
import { FlowNodeDetails } from './FlowNodeDetails';

jest.mock('@/services/auto-healing/execution', () => ({
    getExecutionTask: jest.fn(),
}));

describe('FlowNodeDetails', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('resolves execution task name from task id when flow config only contains the id', async () => {
        (getExecutionTask as jest.Mock).mockResolvedValue({
            data: {
                id: 'task-1',
                name: '磁盘恢复模板',
            },
        });

        render(React.createElement(FlowNodeDetails, {
            nodes: [{
                id: 'exec-1',
                type: 'execution',
                name: '执行磁盘恢复',
                config: {
                    task_template_id: 'task-1',
                },
            } as AutoHealing.FlowNode],
            onEditExecutionTemplate: jest.fn(),
            onOpenNotificationTemplates: jest.fn(),
        }));

        await waitFor(() => {
            expect(screen.getByText('磁盘恢复模板')).toBeTruthy();
        });
        expect(getExecutionTask).toHaveBeenCalledWith('task-1');
    });
});
