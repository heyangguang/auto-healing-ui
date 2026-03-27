import { canAccessPath, __TEST_ONLY__ } from './pathAccess';

describe('pathAccess', () => {
  it('allows shared public paths and denies unknown paths by default', () => {
    expect(canAccessPath('/guide', {})).toBe(true);
    expect(canAccessPath('/account/profile', {})).toBe(true);
    expect(canAccessPath('/not-registered-path', {})).toBe(false);
  });

  it('resolves access from route metadata for exact and dynamic paths', () => {
    const access = {
      canViewPlatformUsers: true,
      canUpdatePlatformUser: true,
    };

    expect(canAccessPath('/platform/users', access)).toBe(true);
    expect(canAccessPath('/platform/users/123/edit', access)).toBe(true);
    expect(canAccessPath('/platform/users/create', { canCreatePlatformUser: false })).toBe(false);
  });

  it('does not treat unknown runtime paths as accessible', () => {
    const dynamicRoutes = __TEST_ONLY__.ROUTE_ACCESS_ENTRIES.filter((entry) => entry.path.includes(':'));
    expect(dynamicRoutes.length).toBeGreaterThan(0);
    expect(canAccessPath('/platform/users/123/unknown', { canViewPlatformUsers: true })).toBe(false);
  });
});
