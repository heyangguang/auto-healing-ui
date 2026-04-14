import { request } from '@umijs/max';
import { unwrapData } from './responseAdapters';

export async function getIncidentSolutionTemplates() {
  return unwrapData(await request<{
    code: number;
    message: string;
    data: AutoHealing.IncidentSolutionTemplate[];
  }>('/api/v1/tenant/incident-solution-templates', {
    method: 'GET',
  }));
}

export async function getIncidentSolutionTemplate(id: string) {
  return unwrapData(await request<{
    code: number;
    message: string;
    data: AutoHealing.IncidentSolutionTemplate;
  }>(`/api/v1/tenant/incident-solution-templates/${id}`, {
    method: 'GET',
  }));
}

export async function createIncidentSolutionTemplate(data: AutoHealing.CreateIncidentSolutionTemplateRequest) {
  return unwrapData(await request<{
    code: number;
    message: string;
    data: AutoHealing.IncidentSolutionTemplate;
  }>('/api/v1/tenant/incident-solution-templates', {
    method: 'POST',
    data,
  }));
}

export async function updateIncidentSolutionTemplate(id: string, data: AutoHealing.UpdateIncidentSolutionTemplateRequest) {
  return unwrapData(await request<{
    code: number;
    message: string;
    data: AutoHealing.IncidentSolutionTemplate;
  }>(`/api/v1/tenant/incident-solution-templates/${id}`, {
    method: 'PUT',
    data,
  }));
}

export async function deleteIncidentSolutionTemplate(id: string) {
  return request<AutoHealing.SuccessResponse>(`/api/v1/tenant/incident-solution-templates/${id}`, {
    method: 'DELETE',
  });
}
