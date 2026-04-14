import {
  createIncidentSolutionTemplate,
  deleteIncidentSolutionTemplate,
  getIncidentSolutionTemplate,
  getIncidentSolutionTemplates,
  updateIncidentSolutionTemplate,
} from './incidentSolutionTemplates';
import { request } from '@umijs/max';

jest.mock('@umijs/max', () => ({
  request: jest.fn(),
}));

describe('incident solution template service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads and mutates incident solution templates via tenant endpoints', async () => {
    (request as jest.Mock)
      .mockResolvedValueOnce({ data: [{ id: 'template-1', name: '模板1' }] })
      .mockResolvedValueOnce({ data: { id: 'template-1', name: '模板1' } })
      .mockResolvedValueOnce({ data: { id: 'template-2', name: '模板2' } })
      .mockResolvedValueOnce({ data: { id: 'template-1', name: '模板1-更新' } })
      .mockResolvedValueOnce({ code: 0, message: 'success' });

    await expect(getIncidentSolutionTemplates()).resolves.toEqual([{ id: 'template-1', name: '模板1' }]);
    await expect(getIncidentSolutionTemplate('template-1')).resolves.toEqual({ id: 'template-1', name: '模板1' });
    await expect(createIncidentSolutionTemplate({
      name: '模板2',
      resolution_template: 'r',
      work_notes_template: 'w',
    })).resolves.toEqual({ id: 'template-2', name: '模板2' });
    await expect(updateIncidentSolutionTemplate('template-1', { name: '模板1-更新' })).resolves.toEqual({ id: 'template-1', name: '模板1-更新' });
    await deleteIncidentSolutionTemplate('template-1');

    expect(request).toHaveBeenNthCalledWith(1, '/api/v1/tenant/incident-solution-templates', { method: 'GET' });
    expect(request).toHaveBeenNthCalledWith(2, '/api/v1/tenant/incident-solution-templates/template-1', { method: 'GET' });
    expect(request).toHaveBeenNthCalledWith(3, '/api/v1/tenant/incident-solution-templates', {
      method: 'POST',
      data: {
        name: '模板2',
        resolution_template: 'r',
        work_notes_template: 'w',
      },
    });
    expect(request).toHaveBeenNthCalledWith(4, '/api/v1/tenant/incident-solution-templates/template-1', {
      method: 'PUT',
      data: { name: '模板1-更新' },
    });
    expect(request).toHaveBeenNthCalledWith(5, '/api/v1/tenant/incident-solution-templates/template-1', { method: 'DELETE' });
  });
});
