import { render, screen } from '@testing-library/react';
import React from 'react';
import {
  createApprovalHistoryColumns,
  createPendingApprovalColumns,
} from './approvalTableColumns';
import type { PendingApprovalRecord } from './types';

function createApprovalRecord(): PendingApprovalRecord {
  return {
    id: 'approval-1',
    flow_instance_id: 'flow-instance-1',
    node_id: 'approval-node',
    node_name: '人工审批',
    status: 'pending',
    timeout_at: null,
    decided_by: null,
    decided_at: null,
    decision_comment: null,
    created_at: '2026-06-16T10:00:00Z',
    flow_instance: {
      id: 'flow-instance-1',
      flow_id: 'flow-1',
      rule_id: 'rule-1',
      incident_id: 'incident-1',
      status: 'running',
      current_node_id: 'approval-node',
      error_message: null,
      started_at: '2026-06-16T10:00:00Z',
      completed_at: null,
      created_at: '2026-06-16T10:00:00Z',
      context: {
        incident: {
          external_id: 'R-000037',
        },
      },
    },
  };
}

describe('approvalTableColumns', () => {
  it('shows incident id between node name and flow instance in pending approvals', () => {
    const columns = createPendingApprovalColumns({
      canApprove: true,
      resolveApprovers: () => '-',
      onApprove: jest.fn(),
      onReject: jest.fn(),
    });

    expect(columns.map((column) => column.columnTitle).slice(0, 3)).toEqual([
      '节点名称',
      '工单ID',
      '流程实例',
    ]);

    const incidentColumn = columns.find(
      (column) => column.columnTitle === '工单ID',
    );
    const content = incidentColumn?.render?.(
      undefined,
      createApprovalRecord(),
      0,
    ) as React.ReactNode;

    render(<>{content}</>);

    expect(screen.getByText('R-000037')).toBeTruthy();
  });

  it('shows incident id between node name and flow instance in approval history', () => {
    const columns = createApprovalHistoryColumns(() => '-');

    expect(columns.map((column) => column.columnTitle).slice(0, 3)).toEqual([
      '节点名称',
      '工单ID',
      '流程实例',
    ]);
  });
});
