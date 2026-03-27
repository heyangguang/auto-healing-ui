import {
  buildSecretsSourcePayload,
  mapSecretsSourceToFormValues,
} from './secretFormConfig';

describe('secretFormConfig', () => {
  it('maps legacy file and vault fields into stable form values', () => {
    expect(
      mapSecretsSourceToFormValues({
        id: 'secret-1',
        name: 'legacy-vault',
        auth_type: 'ssh_key',
        type: 'vault',
        status: 'active',
        created_at: '2026-03-27T00:00:00Z',
        priority: 100,
        is_default: false,
        config: {
          path_template: 'kv/hosts/{hostname}',
          auth: { type: 'approle', role_id: 'role-1' },
        },
      } as AutoHealing.SecretsSource),
    ).toMatchObject({
      vault_auth_type: 'approle',
      vault_role_id: 'role-1',
      vault_secret_path: 'kv/hosts/{hostname}',
    });

    expect(
      mapSecretsSourceToFormValues({
        id: 'secret-2',
        name: 'legacy-file',
        auth_type: 'ssh_key',
        type: 'file',
        status: 'active',
        created_at: '2026-03-27T00:00:00Z',
        priority: 50,
        is_default: true,
        config: {
          path: '/tmp/id_rsa',
          username: 'ops',
        },
      } as AutoHealing.SecretsSource),
    ).toMatchObject({
      file_key_path: '/tmp/id_rsa',
      file_username: 'ops',
    });
  });

  it('preserves existing secret values when edit payload omits new webhook bearer token', () => {
    expect(
      buildSecretsSourcePayload({
        isEdit: true,
        originalConfig: {
          auth: {
            type: 'bearer',
            token: 'persisted-token',
          },
        },
        values: {
          auth_type: 'password',
          is_default: false,
          name: 'webhook-source',
          priority: 100,
          type: 'webhook',
          webhook_auth_type: 'bearer',
          webhook_method: 'POST',
          webhook_url: 'https://vault.example.com/query',
        },
      }),
    ).toMatchObject({
      config: {
        auth: {
          type: 'bearer',
          token: 'persisted-token',
        },
      },
    });
  });

  it('fails explicitly when edit payload tries to keep a redacted secret that was not returned by detail', () => {
    expect(() =>
      buildSecretsSourcePayload({
        isEdit: true,
        originalConfig: {
          auth: { type: 'token' },
        },
        values: {
          auth_type: 'ssh_key',
          is_default: false,
          name: 'vault-source',
          priority: 100,
          type: 'vault',
          vault_address: 'https://vault.example.com',
          vault_auth_type: 'token',
          vault_secret_path: 'kv/hosts/{hostname}',
        },
      }),
    ).toThrow('Vault Token 未返回原始值，请重新输入后再保存');
  });
});
