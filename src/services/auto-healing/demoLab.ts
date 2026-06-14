import { request } from '@umijs/max';

export type DemoScenarioKey = 'clean-logs' | 'kill-process' | 'blacklist';

export type DemoIncidentResult = {
    external_id: string;
    title: string;
    status: string;
    affected_ci?: string;
    scenario: DemoScenarioKey;
    fault_injection?: {
        ok?: boolean;
        output?: string;
        message?: string;
    } | null;
};

export async function createDemoIncident(scenario: DemoScenarioKey) {
    return request<DemoIncidentResult>('/lab-adapter/api/demo/incidents', {
        method: 'POST',
        data: {
            scenario,
            inject_fault: scenario !== 'blacklist',
        },
    });
}
