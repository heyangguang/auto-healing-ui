import {
  buildCreateUserPayload,
  buildUpdateUserPayload,
} from './systemUserFormHelpers';

describe('system user form helpers', () => {
  it('builds create payload with global profile fields only', () => {
    expect(buildCreateUserPayload({
      username: 'ops',
      email: 'ops@example.com',
      password: 'secret123',
      confirm_password: 'secret123',
      display_name: 'Ops',
      role_id: 'role-1',
    })).toEqual({
      username: 'ops',
      email: 'ops@example.com',
      password: 'secret123',
      display_name: 'Ops',
    });
  });

  it('builds edit payload with tenant role only', () => {
    expect(buildUpdateUserPayload({
      username: 'ops',
      email: 'ops@example.com',
      password: '',
      confirm_password: '',
      display_name: 'Ops',
      role_id: 'role-2',
    })).toEqual({
      role_id: 'role-2',
    });
  });
});
