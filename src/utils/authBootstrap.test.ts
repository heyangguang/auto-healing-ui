import { __TEST_ONLY__, isAuthFailureStatus, shouldClearTokensAfterBootstrapFailure } from './authBootstrap';

describe('authBootstrap helpers', () => {
  it('detects 401 as an auth failure', () => {
    expect(isAuthFailureStatus(401)).toBe(true);
    expect(isAuthFailureStatus(500)).toBe(false);
  });

  it('extracts response status from request-like errors', () => {
    expect(__TEST_ONLY__.getErrorStatus({ response: { status: 503 } })).toBe(503);
    expect(__TEST_ONLY__.getErrorStatus(new Error('boom'))).toBeUndefined();
  });

  it('clears tokens only for explicit auth failures', () => {
    expect(shouldClearTokensAfterBootstrapFailure({ response: { status: 401 } })).toBe(true);
    expect(shouldClearTokensAfterBootstrapFailure({ response: { status: 503 } })).toBe(false);
    expect(shouldClearTokensAfterBootstrapFailure(new Error('network'), 'unauthorized')).toBe(true);
    expect(shouldClearTokensAfterBootstrapFailure(new Error('network'), 'server_error')).toBe(false);
  });
});
