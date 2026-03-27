import React from 'react';
import { render, screen } from '@testing-library/react';
import SecretsSourceConnectionConfigCard from './SecretsSourceConnectionConfigCard';
import SecretsSourceRawConfigCard from './SecretsSourceRawConfigCard';

const vaultSource = {
  id: 'secret-1',
  name: 'vault-source',
  type: 'vault',
  auth_type: 'ssh_key',
  status: 'active',
  priority: 100,
  is_default: true,
  created_at: '2026-03-27T00:00:00Z',
  config: {
    address: 'https://vault.example.com',
    auth: {
      type: 'approle',
      token: 'real-token',
      secret_id: 'real-secret-id',
    },
    secret_path: 'kv/hosts/{hostname}',
  },
} as AutoHealing.SecretsSource;

describe('SecretsSource detail cards', () => {
  it('masks sensitive values in raw config output', () => {
    const { container } = render(<SecretsSourceRawConfigCard currentSource={vaultSource} />);

    expect(container.textContent).toContain('"token": "******"');
    expect(container.textContent).toContain('"secret_id": "******"');
    expect(container.textContent).not.toContain('real-token');
    expect(container.textContent).not.toContain('real-secret-id');
  });

  it('shows approle-specific secret fields without rendering a token row', () => {
    render(<SecretsSourceConnectionConfigCard currentSource={vaultSource} />);

    expect(screen.getByText('Secret ID')).toBeTruthy();
    expect(screen.queryByText('Token')).toBeNull();
  });
});
