import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { IncidentCloseModal } from './IncidentCloseModal';
import { getIncidentSolutionTemplates } from '@/services/auto-healing/incidentSolutionTemplates';

jest.mock('@umijs/max', () => ({
  history: { push: jest.fn() },
}));

jest.mock('@/services/auto-healing/incidentSolutionTemplates', () => ({
  getIncidentSolutionTemplates: jest.fn(),
}));

describe('IncidentCloseModal', () => {
  beforeEach(() => {
    (getIncidentSolutionTemplates as jest.Mock).mockResolvedValue([
      {
        id: 'template-1',
        name: '自动修复模板',
        default_close_code: 'auto_healed',
        default_close_status: 'resolved',
      },
    ]);
  });

  it('parses template vars json before submit', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);

    render(
      React.createElement(IncidentCloseModal, {
        loading: false,
        open: true,
        onCancel: jest.fn(),
        onSubmit,
      }),
    );

    await waitFor(() => {
      expect(getIncidentSolutionTemplates).toHaveBeenCalled();
    });

    fireEvent.change(screen.getByLabelText('解决说明'), {
      target: { value: '已恢复' },
    });
    fireEvent.change(screen.getByLabelText('模板变量（JSON）'), {
      target: { value: '{"execution":{"run_id":"run-1"}}' },
    });
    fireEvent.click(screen.getByRole('button', { name: '关闭并回写' }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
        resolution: '已恢复',
        template_vars: {
          execution: { run_id: 'run-1' },
        },
      }));
    });
  });
});
