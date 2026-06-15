import {
  getHostIdentityValues,
  getHostSelectionValue,
  hostMatchesValue,
  isHostExcluded,
  isHostSelected,
  normalizeHostIdentity,
  normalizeSelectedHostValues,
} from './utils';

describe('HostSelector utils', () => {
  const host = {
    id: 'cmdb-1',
    name: 'e2e-target-01',
    hostname: 'e2e-target-01',
    ip_address: '118.196.22.79',
  } as AutoHealing.CMDBItem;

  it('normalizes host identity values for matching', () => {
    expect(normalizeHostIdentity(' E2E-Target-01 ')).toBe('e2e-target-01');
    expect(getHostIdentityValues(host)).toEqual([
      '118.196.22.79',
      'e2e-target-01',
      'cmdb-1',
    ]);
  });

  it('matches excluded template hosts by ip hostname or name', () => {
    expect(isHostExcluded(host, ['e2e-target-01'])).toBe(true);
    expect(isHostExcluded(host, ['118.196.22.79'])).toBe(true);
    expect(isHostExcluded(host, ['other-host'])).toBe(false);
  });

  it('selects hosts by any CMDB identity', () => {
    expect(getHostSelectionValue(host)).toBe('e2e-target-01');
    expect(hostMatchesValue(host, '118.196.22.79')).toBe(true);
    expect(hostMatchesValue(host, 'E2E-TARGET-01')).toBe(true);
    expect(isHostSelected(host, ['118.196.22.79'])).toBe(true);
    expect(isHostSelected(host, ['e2e-target-01'])).toBe(true);
  });

  it('normalizes selected hostname and ip duplicates to one CMDB host', () => {
    expect(
      normalizeSelectedHostValues(
        ['e2e-target-01', '118.196.22.79', 'other-host'],
        [host],
      ),
    ).toEqual(['e2e-target-01', 'other-host']);
  });
});
