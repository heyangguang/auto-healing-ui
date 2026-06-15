import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import WorkbenchPendingApprovalsCard from './WorkbenchPendingApprovalsCard';
import type { PendingWorkbenchItem } from './workbenchTypes';

const styles = {
  card: 'card',
  cardHeader: 'cardHeader',
  cardTitle: 'cardTitle',
  cardTitleIcon: 'cardTitleIcon',
  cardLink: 'cardLink',
  loadingWrap: 'loadingWrap',
  pendingItem: 'pendingItem',
  pendingDot: 'pendingDot',
  pendingContent: 'pendingContent',
  pendingTitle: 'pendingTitle',
  pendingType: 'pendingType',
  pendingTime: 'pendingTime',
};

const approvalItem = (
  overrides: Partial<PendingWorkbenchItem>,
): PendingWorkbenchItem =>
  ({
    _pendingType: 'approval',
    created_at: '刚刚',
    decided_at: null,
    decided_by: null,
    decision_comment: null,
    flow_instance_id: 'flow-1',
    id: 'approval-1',
    node_id: 'approval-node',
    status: 'pending',
    timeout_at: null,
    ...overrides,
  }) as PendingWorkbenchItem;

const triggerItem = (
  overrides: Partial<PendingWorkbenchItem>,
): PendingWorkbenchItem =>
  ({
    _pendingType: 'trigger',
    affected_ci: 'host-1',
    affected_service: '',
    assignee: '',
    category: 'application',
    created_at: '刚刚',
    description: '',
    external_id: 'INC-1',
    healing_flow_instance_id: null,
    healing_status: 'pending',
    id: 'trigger-1',
    matched_rule_id: null,
    plugin_id: null,
    priority: 'P2',
    raw_data: {},
    reporter: '',
    scanned: false,
    severity: 'medium',
    source_created_at: null,
    source_plugin_name: 'demo',
    source_updated_at: null,
    status: 'open',
    title: '自愈触发',
    updated_at: '刚刚',
    workflow_instance_id: null,
    ...overrides,
  }) as PendingWorkbenchItem;

describe('WorkbenchPendingApprovalsCard', () => {
  it('opens the matching pending list for the clicked item', () => {
    const onOpenPendingCenter = jest.fn();
    const onOpenPendingItem = jest.fn();

    render(
      <WorkbenchPendingApprovalsCard
        canViewApprovals
        canViewPendingCenter
        canViewPendingTrigger
        loading={false}
        onOpenPendingCenter={onOpenPendingCenter}
        onOpenPendingItem={onOpenPendingItem}
        pendingApprovals={{
          total: 2,
          items: [
            approvalItem({ id: 'approval-1', title: '任务审批 A' }),
            triggerItem({
              id: 'trigger-1',
              title: '自愈触发 B',
              severity: 'high',
            }),
          ],
        }}
        styles={styles}
      />,
    );

    fireEvent.click(screen.getByText('任务审批 A'));
    expect(onOpenPendingItem).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        id: 'approval-1',
        _pendingType: 'approval',
      }),
    );

    fireEvent.click(screen.getByText('自愈触发 B'));
    expect(onOpenPendingItem).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        id: 'trigger-1',
        _pendingType: 'trigger',
      }),
    );

    fireEvent.click(screen.getByText(/进入待办中心/));
    expect(onOpenPendingCenter).toHaveBeenCalledTimes(1);
  });
});
