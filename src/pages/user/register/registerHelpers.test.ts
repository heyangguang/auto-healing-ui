import { buildRegisterResultPath } from './registerHelpers';

describe('register helpers', () => {
  it('builds the register result path with encoded account', () => {
    expect(buildRegisterResultPath('ops user')).toBe('/user/register-result?account=ops%20user');
  });
});
