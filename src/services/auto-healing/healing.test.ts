import {
  activateRule,
  approveTask,
  cancelInstance,
  createFlow,
  createRule,
  deactivateRule,
  deleteRule,
  deleteFlow,
  dryRunFlow,
  getApproval,
  getApprovals,
  getFlow,
  getFlows,
  getInstance,
  getInstances,
  getRule,
  getRules,
  rejectTask,
  updateRule,
  updateFlow,
} from './healing';
import { request } from '@umijs/max';
import {
  getTenantHealingApprovals,
  postTenantHealingApprovalsIdApprove,
  postTenantHealingApprovalsIdReject,
} from '@/services/generated/auto-healing/approvals';
import {
  deleteTenantHealingFlowsId,
  getTenantHealingFlows,
  getTenantHealingFlowsId,
  postTenantHealingFlows,
  postTenantHealingFlowsIdDryRun,
  putTenantHealingFlowsId,
} from '@/services/generated/auto-healing/healingFlows';
import {
  getTenantHealingInstances,
  getTenantHealingInstancesId,
} from '@/services/generated/auto-healing/flowInstances';
import {
  getTenantHealingRules,
  getTenantHealingRulesId,
  postTenantHealingRules,
  postTenantHealingRulesIdActivate,
} from '@/services/generated/auto-healing/healingRules';

jest.mock('@umijs/max', () => ({
  request: jest.fn(),
}));

jest.mock('@/services/generated/auto-healing/healingFlows', () => ({
  getTenantHealingFlows: jest.fn(),
  getTenantHealingFlowsId: jest.fn(),
  postTenantHealingFlows: jest.fn(),
  putTenantHealingFlowsId: jest.fn(),
  deleteTenantHealingFlowsId: jest.fn(),
  postTenantHealingFlowsIdDryRun: jest.fn(),
}));

jest.mock('@/services/generated/auto-healing/approvals', () => ({
  getTenantHealingApprovals: jest.fn(),
  postTenantHealingApprovalsIdApprove: jest.fn(),
  postTenantHealingApprovalsIdReject: jest.fn(),
}));

jest.mock('@/services/generated/auto-healing/flowInstances', () => ({
  getTenantHealingInstances: jest.fn(),
  getTenantHealingInstancesId: jest.fn(),
}));

jest.mock('@/services/generated/auto-healing/healingRules', () => ({
  getTenantHealingRules: jest.fn(),
  getTenantHealingRulesId: jest.fn(),
  postTenantHealingRules: jest.fn(),
  postTenantHealingRulesIdActivate: jest.fn(),
}));

describe('auto-healing healing service', () => {
  it('delegates stable healing flow wrappers to the generated healing-flow client', async () => {
    await getFlows({ page: 1, page_size: 20, is_active: true, search: 'restart' });
    await getFlow('flow-1');
    await createFlow({} as AutoHealing.CreateFlowRequest);
    await updateFlow('flow-1', {} as AutoHealing.UpdateFlowRequest);
    await deleteFlow('flow-1');
    await dryRunFlow('flow-1', {} as AutoHealing.DryRunRequest);

    expect(getTenantHealingFlows).toHaveBeenCalledWith({
      page: 1,
      page_size: 20,
      is_active: true,
      search: 'restart',
    });
    expect(getTenantHealingFlowsId).toHaveBeenCalledWith({ id: 'flow-1' });
    expect(postTenantHealingFlows).toHaveBeenCalledWith({});
    expect(putTenantHealingFlowsId).toHaveBeenCalledWith(
      { id: 'flow-1' },
      {},
    );
    expect(deleteTenantHealingFlowsId).toHaveBeenCalledWith({ id: 'flow-1' });
    expect(postTenantHealingFlowsIdDryRun).toHaveBeenCalledWith(
      { id: 'flow-1' },
      {},
    );
  });

  it('passes exact-match flow query params through the generated client', async () => {
    await getFlows({
      page: 1,
      page_size: 20,
      name__exact: '磁盘空间自动修复',
      description__exact: '自动执行清理并通知',
      sort_by: 'updated_at',
      sort_order: 'desc',
    });

    expect(getTenantHealingFlows).toHaveBeenLastCalledWith({
      page: 1,
      page_size: 20,
      name__exact: '磁盘空间自动修复',
      description__exact: '自动执行清理并通知',
      sort_by: 'updated_at',
      sort_order: 'desc',
    });
  });

  it('delegates stable approval wrappers to the generated approvals client', async () => {
    await getApprovals({ page: 1, page_size: 20, status: 'pending' });
    await approveTask('approval-1', {} as AutoHealing.ApprovalDecisionRequest);
    await rejectTask('approval-1', {} as AutoHealing.ApprovalDecisionRequest);

    expect(getTenantHealingApprovals).toHaveBeenCalledWith({
      page: 1,
      page_size: 20,
      status: 'pending',
    });
    expect(postTenantHealingApprovalsIdApprove).toHaveBeenCalledWith(
      { id: 'approval-1' },
      {},
    );
    expect(postTenantHealingApprovalsIdReject).toHaveBeenCalledWith(
      { id: 'approval-1' },
      {},
    );
  });

  it('delegates stable healing rule and instance wrappers to generated clients', async () => {
    await getRules({ page: 1, page_size: 10, is_active: true, flow_id: 'flow-1' });
    await getRule('rule-1');
    await createRule({} as AutoHealing.CreateRuleRequest);
    await activateRule('rule-1');
    await getInstances({ page: 2, page_size: 5, status: 'running', flow_id: 'flow-1' });
    await getInstance('instance-1');

    expect(getTenantHealingRules).toHaveBeenCalledWith({
      page: 1,
      page_size: 10,
      is_active: true,
      flow_id: 'flow-1',
    });
    expect(getTenantHealingRulesId).toHaveBeenCalledWith({ id: 'rule-1' });
    expect(postTenantHealingRules).toHaveBeenCalledWith({});
    expect(postTenantHealingRulesIdActivate).toHaveBeenCalledWith({ id: 'rule-1' });
    expect(getTenantHealingInstances).toHaveBeenCalledWith({
      page: 2,
      page_size: 5,
      status: 'running',
      flow_id: 'flow-1',
    });
    expect(getTenantHealingInstancesId).toHaveBeenCalledWith({ id: 'instance-1' });
  });

  it('calls tenant-scoped request endpoints for handwritten rule and instance actions', async () => {
    await updateRule('rule-1', {} as AutoHealing.UpdateRuleRequest);
    await deleteRule('rule-1', true);
    await deactivateRule('rule-1');
    await cancelInstance('instance-1');
    await getApproval('approval-1');

    expect(request).toHaveBeenNthCalledWith(1, '/api/v1/tenant/healing/rules/rule-1', {
      method: 'PUT',
      data: {},
    });
    expect(request).toHaveBeenNthCalledWith(2, '/api/v1/tenant/healing/rules/rule-1', {
      method: 'DELETE',
      params: { force: true },
    });
    expect(request).toHaveBeenNthCalledWith(3, '/api/v1/tenant/healing/rules/rule-1/deactivate', {
      method: 'POST',
    });
    expect(request).toHaveBeenNthCalledWith(4, '/api/v1/tenant/healing/instances/instance-1/cancel', {
      method: 'POST',
    });
    expect(request).toHaveBeenNthCalledWith(5, '/api/v1/tenant/healing/approvals/approval-1', {
      method: 'GET',
    });
  });
});
