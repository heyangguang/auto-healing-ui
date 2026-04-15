import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import WorkbenchPendingApprovalsCard from './WorkbenchPendingApprovalsCard';

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
            { id: 'approval-1', _pendingType: 'approval', title: '任务审批 A', created_at: '刚刚' },
            { id: 'trigger-1', _pendingType: 'trigger', title: '自愈触发 B', created_at: '刚刚', severity: 'high' },
          ],
        }}
        styles={styles}
      />,
    );

    fireEvent.click(screen.getByText('任务审批 A'));
    expect(onOpenPendingItem).toHaveBeenNthCalledWith(1, expect.objectContaining({
      id: 'approval-1',
      _pendingType: 'approval',
    }));

    fireEvent.click(screen.getByText('自愈触发 B'));
    expect(onOpenPendingItem).toHaveBeenNthCalledWith(2, expect.objectContaining({
      id: 'trigger-1',
      _pendingType: 'trigger',
    }));

    fireEvent.click(screen.getByText(/进入待办中心/));
    expect(onOpenPendingCenter).toHaveBeenCalledTimes(1);
  });
});
