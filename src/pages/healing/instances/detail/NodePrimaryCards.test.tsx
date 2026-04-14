import React from 'react';
import { render, screen } from '@testing-library/react';
import NodePrimaryCards from './NodePrimaryCards';

describe('NodePrimaryCards', () => {
  it('renders cmdb validator summaries when validation_summary is an object', () => {
    render(
      <NodePrimaryCards
        resolvedNames={{}}
        selectedNodeData={{
          id: 'cmdb-validator-1',
          name: 'CMDB验证',
          type: 'cmdb_validator',
          status: 'completed',
          state: {
            status: 'completed',
            validation_summary: {
              total: 3,
              valid: 2,
              invalid: 1,
            },
            validated_hosts: [
              { hostname: 'real-host-101', ip_address: '10.0.0.101' },
              { name: 'db-prod-02', ip: '10.0.0.102' },
            ],
            invalid_hosts: [
              { host: 'real-host-103', ip_address: '10.0.0.103' },
            ],
          },
        }}
        stdoutLogs={[]}
      />,
    );

    expect(screen.getByText('CMDB 验证结果')).toBeTruthy();
    expect(screen.getByText('总计 3')).toBeTruthy();
    expect(screen.getByText('通过 2')).toBeTruthy();
    expect(screen.getByText('未通过 1')).toBeTruthy();
    expect(screen.getByText('real-host-101 (10.0.0.101)')).toBeTruthy();
    expect(screen.getByText('db-prod-02 (10.0.0.102)')).toBeTruthy();
    expect(screen.getByText('real-host-103 (10.0.0.103)')).toBeTruthy();
  });
});
